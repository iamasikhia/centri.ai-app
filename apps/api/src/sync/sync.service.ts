import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class SyncService {
    constructor(
        private prisma: PrismaService,
        private integrationsService: IntegrationsService,
        private encryption: EncryptionService,
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
                // Upsert meetings to avoid duplicates
                // Ideally we check if it exists or clear old ones. For MVP upsert based on composite key or ID?
                // My schema uses random UUID for ID, so I need to find by `calendarEventId`.
                const existing = await this.prisma.meeting.findFirst({
                    where: { userId, calendarEventId: m.calendarEventId }
                });

                if (existing) {
                    await this.prisma.meeting.update({ where: { id: existing.id }, data: m });
                } else {
                    await this.prisma.meeting.create({ data: { ...m, userId } });
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
    }
}
