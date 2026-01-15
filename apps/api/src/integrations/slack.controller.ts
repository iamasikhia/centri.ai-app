import { Controller, Get, Post, Delete, Body, Param, Headers, NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';

// Simple in-memory cache for Slack channels to prevent rate limiting
const channelCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Controller('slack')
export class SlackController {
    constructor(
        private integrationsService: IntegrationsService,
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) { }

    @Get('channels')
    async getChannels(@Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';

        // Check cache first
        const cached = channelCache.get(uid);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
            console.log('[Slack] Returning cached channels for user:', uid);
            return cached.data;
        }

        try {
            console.log('[Slack] Fetching channels for user:', uid);

            // Get Slack integration for user
            const integration = await this.prisma.integrations.findUnique({
                where: {
                    userId_provider: {
                        userId: uid,
                        provider: 'slack',
                    },
                },
            });

            if (!integration) {
                console.log('[Slack] No integration found');
                throw new NotFoundException('Slack not connected');
            }

            console.log('[Slack] Integration found, decrypting tokens...');
            // Decrypt tokens
            const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
            console.log('[Slack] Tokens decrypted, syncing data...');

            // Get Slack provider and sync data
            const slackProvider = this.integrationsService.getProvider('slack');
            const syncResult = await slackProvider.syncData(userId, tokens);

            console.log('[Slack] Sync complete. Channels:', syncResult.customData?.channels?.length || 0, 'Members:', syncResult.teamMembers?.length || 0);

            const result = {
                channels: syncResult.customData?.channels || [],
                members: syncResult.teamMembers || [],
            };

            // Cache the result (only if we got data)
            if (result.channels.length > 0) {
                channelCache.set(uid, { data: result, timestamp: Date.now() });
            }

            return result;
        } catch (error) {
            console.error('[Slack] Error in getChannels:', error);

            // If we hit rate limit, return cached data if available (even if stale)
            const staleCache = channelCache.get(uid);
            if (staleCache && error.message?.includes('429')) {
                console.log('[Slack] Returning stale cache due to rate limit');
                return staleCache.data;
            }

            throw error;
        }
    }

    @Get('members')
    async getMembers(@Headers('x-user-id') userId: string) {
        const integration = await this.prisma.integrations.findUnique({
            where: {
                userId_provider: {
                    userId: userId || 'default-user-id',
                    provider: 'slack',
                },
            },
        });

        if (!integration) {
            throw new NotFoundException('Slack not connected');
        }

        const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
        const slackProvider = this.integrationsService.getProvider('slack');
        const syncResult = await slackProvider.syncData(userId, tokens);

        return {
            members: syncResult.teamMembers || [],
        };
    }
    @Get('activity')
    async getActivity(@Headers('x-user-id') userId: string) {
        try {
            const integration = await this.prisma.integrations.findUnique({
                where: {
                    userId_provider: {
                        userId: userId || 'default-user-id',
                        provider: 'slack',
                    },
                },
            });

            if (!integration) {
                throw new NotFoundException('Slack not connected');
            }

            const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
            const slackProvider = this.integrationsService.getProvider('slack') as any; // Cast as any to avoid circular dependency/import issues for now, or fetch SlackProvider

            // 1. Get Channels first
            const syncResult = await slackProvider.syncData(userId, tokens);
            const channels = syncResult.customData?.channels || [];

            // 2. Fetch history for top active channels (limit to 3 for performance)
            const topChannels = channels.slice(0, 3);
            const activity = [];

            for (const channel of topChannels) {
                if (slackProvider.getHistory) {
                    const messages = await slackProvider.getHistory(tokens.access_token, channel.id, 5);
                    if (messages.length > 0) {
                        activity.push({
                            channelName: channel.name,
                            channelId: channel.id,
                            messages: messages.map(m => ({
                                text: m.text,
                                user: m.user,
                                ts: m.ts
                            }))
                        });
                    }
                }
            }

            return { activity };
        } catch (error) {
            console.error('[Slack] Error in getActivity:', error);
            throw error;
        }
    }
    @Get('questions')
    async getQuestions(@Headers('x-user-id') userId: string) {
        return this.prisma.scheduledQuestion.findMany({
            where: { userId: userId || 'default-user-id' },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Post('questions')
    async createQuestion(@Headers('x-user-id') userId: string, @Body() body: any) {
        return this.prisma.scheduledQuestion.create({
            data: {
                userId: userId || 'default-user-id',
                title: body.title,
                text: body.text,
                frequency: body.frequency,
                timeOfDay: body.timeOfDay,
                targetType: body.targetType,
                targetId: body.targetId,
                selectedDays: body.selectedDays || []
            }
        });
    }


    @Post('questions/run')
    async runScheduledQuestions(@Headers('x-user-id') userId: string) {
        console.log('[Slack] Running scheduled questions check...');
        const uid = userId || 'default-user-id';

        // 1. Get Due Questions (For MVP: Get ALL active questions for user)
        const questions = await this.prisma.scheduledQuestion.findMany({
            where: { userId: uid, isActive: true }
        });

        if (questions.length === 0) return { count: 0, message: 'No questions to run' };

        // 2. Get Integration
        const integration = await this.prisma.integrations.findUnique({
            where: { userId_provider: { userId: uid, provider: 'slack' } }
        });

        if (!integration) throw new NotFoundException('Slack not connected');

        const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
        const slackProvider = this.integrationsService.getProvider('slack') as any;

        let sentCount = 0;
        const results = [];

        for (const q of questions) {
            // Check if due (Simplified logic: If daily, send if not sent today)
            const today = new Date().toDateString();
            const lastSent = q.lastSentAt ? new Date(q.lastSentAt).toDateString() : null;

            if (lastSent === today && q.frequency !== 'always_test') {
                // Already sent today
                continue;
            }

            // Check Day of Week
            if (q.selectedDays && q.selectedDays.length > 0) {
                const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
                if (!q.selectedDays.includes(currentDay)) {
                    console.log(`[Slack] Skipping question "${q.title}": Today (${currentDay}) is not in selected days (${q.selectedDays.join(', ')})`);
                    continue;
                }
            }

            let success = false;
            let messageTs: string | null = null;
            // Send Message
            if (q.targetType === 'channel' && q.targetId) {
                console.log(`[Slack] Sending question "${q.title}" to channel ${q.targetId}`);
                const postResult = await slackProvider.postMessage(tokens.access_token, q.targetId, q.text);
                success = postResult.ok;
                messageTs = postResult.ts || null;
            } else if (q.targetType === 'dm') {
                // Send to all team members? Or specific? MVP: Send to a default channel or warn
                console.warn('[Slack] DM broadcasting not fully implemented yet, skipping');
            }

            if (success) {
                sentCount++;
                results.push({ id: q.id, status: 'sent', messageTs });
                // Update lastSentAt AND lastMessageTs (to track replies later)
                await this.prisma.scheduledQuestion.update({
                    where: { id: q.id },
                    data: { lastSentAt: new Date(), lastMessageTs: messageTs }
                });
            } else {
                results.push({ id: q.id, status: 'failed' });
            }
        }

        return { sent: sentCount, results };
    }

    @Post('questions/:id')
    async updateQuestion(@Headers('x-user-id') userId: string, @Param('id') id: string, @Body() body: any) {

        // Verify ownership
        const existing = await this.prisma.scheduledQuestion.findFirst({
            where: { id, userId: userId || 'default-user-id' }
        });

        if (!existing) {
            throw new NotFoundException('Question not found');
        }

        return this.prisma.scheduledQuestion.update({
            where: { id },
            data: {
                title: body.title,
                text: body.text,
                frequency: body.frequency,
                timeOfDay: body.timeOfDay,
                targetType: body.targetType,
                targetId: body.targetId,
                selectedDays: body.selectedDays || []
            }
        });
    }

    @Post('questions/:id/test')
    async testQuestion(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        console.log(`[Slack] Testing question ${id}...`);
        const uid = userId || 'default-user-id';

        const question = await this.prisma.scheduledQuestion.findFirst({
            where: { id, userId: uid }
        });

        if (!question) throw new NotFoundException('Question not found');

        const integration = await this.prisma.integrations.findUnique({
            where: { userId_provider: { userId: uid, provider: 'slack' } }
        });

        if (!integration) throw new NotFoundException('Slack not connected');

        const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
        const slackProvider = this.integrationsService.getProvider('slack') as any;

        let success = false;
        let messageTs: string | null = null;
        try {
            if (question.targetType === 'channel' && question.targetId) {
                console.log(`[Slack] Test sending "${question.title}" to ${question.targetId}`);
                const result = await slackProvider.postMessage(tokens.access_token, question.targetId, question.text);
                success = result.ok;
                messageTs = result.ts || null;
                if (!success) {
                    throw new Error(result.error || 'Failed to post message');
                }
            } else {
                throw new Error('Unsupported target type for test');
            }
        } catch (e) {
            throw new BadRequestException(`Slack Error: ${e.message}`);
        }

        if (success) {
            // Update lastSentAt AND lastMessageTs to track replies
            await this.prisma.scheduledQuestion.update({
                where: { id: question.id },
                data: { lastSentAt: new Date(), lastMessageTs: messageTs }
            });
            return { status: 'success', message: 'Test message sent', messageTs };
        } else {
            throw new Error('Failed to send message to Slack');
        }
    }

    @Delete('questions/:id')
    async deleteQuestion(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        return this.prisma.scheduledQuestion.deleteMany({
            where: {
                id: id,
                userId: userId || 'default-user-id'
            }
        });
    }

    /**
     * Fetch responses to a check-in question from Slack.
     * This retrieves BOTH threaded replies AND channel messages sent after the question.
     */
    @Get('questions/:id/responses')
    async getQuestionResponses(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        const uid = userId || 'default-user-id';

        // 1. Get the question
        const question = await this.prisma.scheduledQuestion.findFirst({
            where: { id, userId: uid },
            include: { responses: { orderBy: { createdAt: 'desc' } } }
        });

        if (!question) throw new NotFoundException('Question not found');

        // 2. If we have a lastMessageTs, fetch fresh replies from Slack
        if (question.lastMessageTs && question.targetId) {
            const integration = await this.prisma.integrations.findUnique({
                where: { userId_provider: { userId: uid, provider: 'slack' } }
            });

            if (integration) {
                const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
                const slackProvider = this.integrationsService.getProvider('slack') as any;

                // Fetch BOTH threaded replies AND channel messages after the question
                const [threadReplies, channelMessages] = await Promise.all([
                    slackProvider.getThreadReplies(
                        tokens.access_token,
                        question.targetId,
                        question.lastMessageTs
                    ),
                    slackProvider.getMessagesAfter(
                        tokens.access_token,
                        question.targetId,
                        question.lastMessageTs,
                        30 // Limit to 30 messages after the question
                    )
                ]);

                console.log(`[Slack] Found ${threadReplies.length} thread replies and ${channelMessages.length} channel messages`);

                // Combine both sources and deduplicate by timestamp
                const allMessages = [...threadReplies, ...channelMessages];
                const uniqueMessages = new Map();
                allMessages.forEach(m => {
                    if (!uniqueMessages.has(m.ts)) {
                        uniqueMessages.set(m.ts, m);
                    }
                });

                // 3. Store any NEW replies (check if slackTs already exists)
                const existingTs = new Set(question.responses.map(r => r.slackTs));

                for (const [ts, msg] of uniqueMessages.entries()) {
                    if (!existingTs.has(ts) && msg.text) {
                        await this.prisma.questionResponse.create({
                            data: {
                                questionId: question.id,
                                slackUser: msg.user || 'Unknown',
                                text: msg.text,
                                slackTs: ts,
                            }
                        });
                    }
                }

                // 4. Re-fetch responses after update
                const updatedResponses = await this.prisma.questionResponse.findMany({
                    where: { questionId: question.id },
                    orderBy: { createdAt: 'desc' }
                });

                return {
                    questionId: question.id,
                    questionTitle: question.title,
                    lastSentAt: question.lastSentAt,
                    responses: updatedResponses.map(r => ({
                        id: r.id,
                        slackUser: r.slackUser,
                        text: r.text,
                        createdAt: r.createdAt.toISOString()
                    }))
                };
            }
        }

        // Fallback: Return stored responses without fresh fetch
        return {
            questionId: question.id,
            questionTitle: question.title,
            lastSentAt: question.lastSentAt,
            responses: question.responses.map(r => ({
                id: r.id,
                slackUser: r.slackUser,
                text: r.text,
                createdAt: r.createdAt.toISOString()
            }))
        };
    }

}
