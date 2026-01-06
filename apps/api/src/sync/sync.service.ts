import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CalendarClassificationService } from '../integrations/calendar-classification.service';

@Injectable()
export class SyncService {
    constructor(
        private prisma: PrismaService,
        private integrationsService: IntegrationsService,
        private encryption: EncryptionService,
        private classifier: CalendarClassificationService,
    ) { }

    async syncAll(userId: string) {
        const integrations = await this.prisma.integrations.findMany({
            where: { userId },
        });

        for (const integration of integrations) {
            await this.performSync(userId, integration);
        }

        return { success: true, count: integrations.length };
    }

    private async performSync(userId: string, integration: any) {
        const provider = this.integrationsService.getProvider(integration.provider);
        if (!provider) return;

        try {
            // Decrypt tokens
            const tokensStr = this.encryption.decrypt(integration.encryptedBlob);
            const tokens = JSON.parse(tokensStr);

            // Check for refresh (omitted for MVP simplicity mostly, but logic belongs here)
            // if (provider.refreshTokens && isExpired) ...

            // Log start
            await this.prisma.syncRun.create({
                data: { userId, provider: integration.provider, status: 'running' }
            });

            const data = await provider.syncData(userId, tokens);

            // Save Data
            await this.saveData(userId, integration.provider, data);

            // Log success
            await this.prisma.syncRun.create({
                data: { userId, provider: integration.provider, status: 'success', finishedAt: new Date() }
            });

        } catch (e) {
            console.error(`Sync failed for ${integration.provider}`, e);
            await this.prisma.syncRun.create({
                data: { userId, provider: integration.provider, status: 'failed', error: e.message, finishedAt: new Date() }
            });
        }
    }

    private async saveData(userId: string, providerName: string, data: any) {
        // 1. Meetings
        if (data.meetings) {
            for (const m of data.meetings) {
                // Classify
                const classification = await this.classifier.classify({
                    title: m.title,
                    description: m.description,
                    attendeesCount: m.rawAttendeesCount,
                    hasConference: m.hasConference,
                    isSelfOrganized: m.isSelfOrganized,
                    durationMinutes: m.durationMinutes
                });

                // Prepare data (exclude temp fields)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { rawAttendeesCount, hasConference, isSelfOrganized, durationMinutes, ...dbData } = m;
                const meetingData = {
                    ...dbData,
                    calendarEventType: classification.type,
                    calendarEventConfidence: classification.confidence,
                    calendarEventReasoning: classification.reason
                };

                const existing = await this.prisma.meeting.findFirst({
                    where: { userId, calendarEventId: m.calendarEventId }
                });

                if (existing) {
                    await this.prisma.meeting.update({ where: { id: existing.id }, data: meetingData });
                } else {
                    const newMeeting = await this.prisma.meeting.create({ data: { ...meetingData, userId } });

                    // Emit UpdateItem
                    try {
                        await this.prisma.updateItem.create({
                            data: {
                                userId,
                                source: providerName === 'google' ? 'google_calendar' : providerName,
                                type: `calendar_${classification.type}`,
                                severity: classification.type === 'meeting' ? 'important' : 'info',
                                title: classification.type === 'meeting' ? `New Meeting: ${newMeeting.title}` : `Time Block: ${newMeeting.title}`,
                                body: `Scheduled for ${newMeeting.startTime.toLocaleString()}`,
                                occurredAt: newMeeting.startTime,
                                externalId: m.calendarEventId,
                                url: newMeeting.htmlLink,
                                isRead: false
                            }
                        });
                    } catch (e) {
                        if (!e.message?.includes('Unique constraint')) {
                            console.error('Failed to create UpdateItem', e);
                        }
                    }
                }
            }
        }

        // 2. Tasks
        if (data.tasks) {
            for (const t of data.tasks) {
                const existing = await this.prisma.task.findFirst({
                    where: { userId, externalId: t.externalId }
                });

                if (existing) {
                    await this.prisma.task.update({ where: { id: existing.id }, data: t });
                } else {
                    await this.prisma.task.create({ data: { ...t, userId } });
                }
            }
        }

        // 3. Team Members
        if (data.teamMembers) {
            for (const tm of data.teamMembers) {
                const existing = await this.prisma.teamMember.findFirst({
                    where: { userId, externalId: tm.externalId }
                });

                if (existing) {
                    await this.prisma.teamMember.update({ where: { id: existing.id }, data: tm });
                } else {
                    await this.prisma.teamMember.create({ data: { ...tm, userId } });
                }
            }
        }

        // 4. Emails
        if (data.emails) {
            for (const email of data.emails) {
                try {
                    // Check if exists to avoid error spam
                    const exists = await this.prisma.updateItem.findFirst({
                        where: { userId, source: 'gmail', externalId: email.externalId }
                    });

                    if (!exists) {
                        await this.prisma.updateItem.create({
                            data: {
                                userId,
                                source: 'gmail',
                                type: 'email',
                                severity: 'info',
                                title: email.title || 'No Subject',
                                body: email.snippet || '',
                                occurredAt: email.receivedAt,
                                externalId: email.externalId,
                                url: email.link,
                                isRead: false
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to process email', e);
                }
            }
        }
    }
}
