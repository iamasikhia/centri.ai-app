import { Controller, Get, Post, Delete, Body, Param, Headers, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';

@Controller('slack')
export class SlackController {
    constructor(
        private integrationsService: IntegrationsService,
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) { }

    @Get('channels')
    async getChannels(@Headers('x-user-id') userId: string) {
        try {
            console.log('[Slack] Fetching channels for user:', userId || 'default-user-id');

            // Get Slack integration for user
            const integration = await this.prisma.integrations.findUnique({
                where: {
                    userId_provider: {
                        userId: userId || 'default-user-id',
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

            return {
                channels: syncResult.customData?.channels || [],
                members: syncResult.teamMembers || [],
            };
        } catch (error) {
            console.error('[Slack] Error in getChannels:', error);
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
                targetId: body.targetId
            }
        });
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

            let success = false;
            // Send Message
            if (q.targetType === 'channel' && q.targetId) {
                console.log(`[Slack] Sending question "${q.title}" to channel ${q.targetId}`);
                success = await slackProvider.postMessage(tokens.access_token, q.targetId, q.text);
            } else if (q.targetType === 'dm') {
                // Send to all team members? Or specific? MVP: Send to a default channel or warn
                console.warn('[Slack] DM broadcasting not fully implemented yet, skipping');
            }

            if (success) {
                sentCount++;
                results.push({ id: q.id, status: 'sent' });
                // Update lastSentAt
                await this.prisma.scheduledQuestion.update({
                    where: { id: q.id },
                    data: { lastSentAt: new Date() }
                });
            } else {
                results.push({ id: q.id, status: 'failed' });
            }
        }

        return { sent: sentCount, results };
    }
}
