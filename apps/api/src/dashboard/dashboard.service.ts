import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, addDays, isPast, isToday, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
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

    async getDashboardData(userId: string, range: string = 'week') {
        const today = new Date();
        let startDate = startOfWeek(today); // Default

        switch (range) {
            case 'day':
                startDate = startOfDay(today);
                break;
            case 'week':
                startDate = startOfWeek(today); // Default to Sunday/Monday depending on locale, usually fine
                break;
            case 'month':
                startDate = startOfMonth(today);
                break;
            case 'year':
                startDate = startOfYear(today);
                break;
            default:
                startDate = startOfWeek(today);
        }

        const nextWeek = addDays(today, 7); // For upcoming view, we might still want to look ahead? 
        // Actually, if a user selects "Month", they probably want to see *historical* data for that month?
        // The dashboard mixes "Past Performance" (metrics) and "Future Focus" (upcoming calls).
        // Let's keep "Upcoming Calls" looking ahead regardless of selected historical range, or maybe unrelated.
        // But metrics (Decisions, updates, tasks done) should respect the range.

        // Fetch Urgent Updates
        // We consider 'urgent' and 'important' items that are not dismissed as potential Risks or Attention items
        const recentUpdates = await this.prisma.updateItem.findMany({
            where: {
                userId,
                isDismissed: false,
                severity: { in: ['urgent', 'important', 'high'] },
                // Filter out raw calendar events from alerts unless they are flagged as important by another system
                // The user explicitly requested "from call transcripts not event names", so we ignore 'google_calendar' source updates for now
                source: { not: 'google_calendar' },
                occurredAt: { gte: startDate }
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
                // Note: Github Intelligence service might need to be range-aware in future
                // For now, we return standard analysis but maybe filter raw items later?
                // Or just leave as is since it's "Current Intelligence"
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

        // 3. Meetings (For historical range analysis AND upcoming)
        // We'll fetch meetings fitting the range for metrics
        const rangeMeetings = await this.prisma.meeting.findMany({
            where: {
                userId,
                startTime: { gte: startDate }
            },
            orderBy: { startTime: 'asc' }
        });

        // Map for display
        const meetings = rangeMeetings.map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime.toISOString(),
            endTime: m.endTime.toISOString(),
            attendeeEmails: JSON.parse(m.attendeesJson || '[]').map((a: any) => a.email || a),
            sourceUrl: m.meetLink || m.htmlLink,
            type: (m as any).calendarEventType || 'meeting',
            confidence: (m as any).calendarEventConfidence,
            reason: (m as any).calendarEventReasoning,
            decisions: m.decisionsJson ? JSON.parse(m.decisionsJson) : [],
            blockers: m.blockersJson ? JSON.parse(m.blockersJson) : []
        }));

        // 4. Tasks (All active or recently updated)
        const tasksRaw = await this.prisma.task.findMany({
            where: { userId }
        });

        // Filter active tasks (for focus) - Keep all pending/active
        // Filter done tasks - Only count if done within range
        const viewableTasks = tasksRaw.filter(t => {
            if (t.status === 'Done' || t.status === 'Complete') {
                return new Date(t.updatedAt) >= startDate;
            }
            return true; // Keep all active tasks visible for "What do I do now?"
        });

        const tasks = viewableTasks.map(t => ({
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


        // 5. Total Decisions Calculation & Blockers
        // Use rangeMeetings which is already filtered by start date
        // Note: rangeMeetings query needs to select fields, but we fetched *all* fields by default above, so we are good.

        const totalDecisions = rangeMeetings.reduce((acc, meeting) => {
            if (!meeting.decisionsJson) return acc;
            try {
                const decisions = JSON.parse(meeting.decisionsJson);
                return acc + (Array.isArray(decisions) ? decisions.length : 0);
            } catch (e) {
                return acc;
            }
        }, 0);

        const totalBlockers = rangeMeetings.reduce((acc, meeting) => {
            if (!meeting.blockersJson) return acc;
            try {
                const blockers = JSON.parse(meeting.blockersJson);
                // Support both list of strings or list of objects if format varies
                return acc + (Array.isArray(blockers) ? blockers.length : 0);
            } catch (e) {
                return acc;
            }
        }, 0);

        return {
            lastSyncedAt: lastSync?.finishedAt?.toISOString() || null,
            people,
            tasks,
            meetings,
            updates,
            githubIntelligence,
            totalDecisions,
            totalBlockers, // New Field
            focusTasks: [],
            blockers: [],
            teamStats: [],
            teamMembers: []
        };
    }
}
