import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, addDays, isPast, isToday, startOfWeek } from 'date-fns';
import { GithubIntelligenceService } from '../integrations/github-intelligence.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { GithubProvider } from '../integrations/providers/github.provider';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private integrationsService: IntegrationsService,
        private githubIntelligenceService: GithubIntelligenceService
    ) { }

    async getDashboardData(userId: string) {
        const today = new Date();
        const nextWeek = addDays(today, 7);

        // Fetch Urgent Updates (from Slack, Transcripts/Meetings "google_calendar")
        // We consider 'urgent' and 'important' items that are not dismissed as potential Risks or Attention items
        const recentUpdates = await this.prisma.updateItem.findMany({
            where: {
                userId,
                isDismissed: false,
                severity: { in: ['urgent', 'important', 'high'] },
                // Filter out raw calendar events from alerts unless they are flagged as important by another system
                // The user explicitly requested "from call transcripts not event names", so we ignore 'google_calendar' source updates for now
                source: { not: 'google_calendar' }
            },
            orderBy: { occurredAt: 'desc' },
            take: 10
        });

        const updates = recentUpdates.map(u => ({
            id: u.id,
            text: u.title,
            severity: u.severity === 'urgent' ? 'High' : 'Medium',
            type: 'blocker', // Default type, logic can refine this based on content
            source: u.source,
            createdAt: u.createdAt.toISOString()
        }));

        // --- GitHub Intelligence Integration ---
        let githubIntelligence = null;
        try {
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (token && token.access_token) {
                const provider = this.integrationsService.getProvider('github') as GithubProvider;
                // Fetch raw activity
                const activity = await provider.fetchActivity(token.access_token);
                // Transform into PM insights
                githubIntelligence = this.githubIntelligenceService.processActivity(activity);
            }
        } catch (e) {
            console.error('Failed to fetch GitHub Intelligence', e);
        }

        // 1. Last Sync
        const lastSync = await this.prisma.syncRun.findFirst({
            where: { userId, status: 'success' },
            orderBy: { finishedAt: 'desc' }
        });

        // 2. People (Team Members)
        const teamMembers = await this.prisma.teamMember.findMany({
            where: { userId }
        });

        const people = teamMembers.map(tm => ({
            id: tm.id,
            displayName: tm.name,
            email: tm.email,
            avatarUrl: tm.avatarUrl,
            sources: JSON.parse(tm.sourcesJson || '[]')
        }));

        // 3. Meetings (Next 7 days)
        const meetingsRaw = await this.prisma.meeting.findMany({
            where: {
                userId,
                startTime: {
                    gte: startOfWeek(today),
                    lte: endOfDay(nextWeek)
                }
            },
            orderBy: { startTime: 'asc' }
        });

        const meetings = meetingsRaw.map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime.toISOString(),
            endTime: m.endTime.toISOString(),
            attendeeEmails: JSON.parse(m.attendeesJson || '[]').map((a: any) => a.email || a),
            sourceUrl: m.meetLink || m.htmlLink,
            type: (m as any).calendarEventType || 'meeting',
            confidence: (m as any).calendarEventConfidence,
            reason: (m as any).calendarEventReasoning
        }));

        // 4. Tasks (All active or recently updated)
        const tasksRaw = await this.prisma.task.findMany({
            where: { userId }
        });

        // Filter for relevant tasks (not old done tasks)
        // Filter for relevant tasks: Active OR Done within the last 7 days
        const activeTasks = tasksRaw.filter(t => t.status !== 'Done' || !isPast(addDays(new Date(t.updatedAt), 7)));

        const tasks = activeTasks.map(t => ({
            id: t.id,
            title: t.title,
            assigneeEmail: t.assigneeEmail,
            status: t.status,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
            priority: t.priority,
            isBlocked: t.isBlocked,
            blockedBy: t.blockedByJson ? JSON.parse(t.blockedByJson) : [],
            updatedAt: t.updatedAt.toISOString(),
            createdAt: t.createdAt.toISOString(),
            // Infer source from externalId or other heuristic if needed, or null
            source: t.externalId.includes('-') ? 'jira' : 'other',
            sourceUrl: null
        }));


        return {
            lastSyncedAt: lastSync?.finishedAt?.toISOString() || null,
            people,
            tasks,
            meetings,
            updates, // New Field
            githubIntelligence, // New Field
            // Keep legacy fields for safety if needed, but simplified
            focusTasks: [],
            blockers: [],
            teamStats: [],
            teamMembers: []
        };
    }
}
