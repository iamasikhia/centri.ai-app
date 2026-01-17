import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, addDays, isPast, isToday, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { GithubIntelligenceService } from '../integrations/github-intelligence.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { GithubProvider } from '../integrations/providers/github.provider';

// Simple in-memory cache for dashboard data
interface CacheEntry {
    data: any;
    timestamp: number;
}

@Injectable()
export class DashboardService {
    private dashboardCache = new Map<string, CacheEntry>();
    private readonly CACHE_TTL_MS = 30000; // 30 seconds cache

    constructor(
        private prisma: PrismaService,
        private integrationsService: IntegrationsService,
        private githubIntelligenceService: GithubIntelligenceService
    ) { }

    async getDashboardData(userId: string, range: string = 'week') {
        // Check cache first
        const cacheKey = `${userId}:${range}`;
        const cached = this.dashboardCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            console.log(`[Dashboard] Returning cached data for ${userId}`);
            return cached.data;
        }

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
            where: {
                userId,
                status: { in: ['success', 'partial_success'] }
            },
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
            blockers: (m as any).blockersJson ? JSON.parse((m as any).blockersJson) : [],
            actionItems: m.actionItemsJson ? JSON.parse(m.actionItemsJson) : []
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
            if (!(meeting as any).blockersJson) return acc;
            try {
                const blockers = JSON.parse((meeting as any).blockersJson);
                // Support both list of strings or list of objects if format varies
                return acc + (Array.isArray(blockers) ? blockers.length : 0);
            } catch (e) {
                return acc;
            }
        }, 0);

        // --- REALITY CHECK (Alignment Analysis) ---
        const realityCheck: any[] = [];
        if (githubIntelligence && githubIntelligence.initiatives) {
            const activeInitiatives = (githubIntelligence.initiatives as any[]).map(i => i.name.toLowerCase());

            // Check recent High-Level decisions for alignment
            // We focus on decisions that imply work ("build", "implement", "fix")
            meetings.forEach(m => {
                if (m.decisions && Array.isArray(m.decisions)) {
                    m.decisions.forEach((d: string) => {
                        const decisionLower = d.toLowerCase();
                        // Filter for actionable decisions
                        if (decisionLower.includes('approve') || decisionLower.includes('agree') || decisionLower.includes('decide')) {
                            // Extract potential topics
                            const keywords = decisionLower.split(' ')
                                .filter(w => w.length > 4) // Filter out small words
                                .filter(w => !['decided', 'agreed', 'approved', 'meeting', 'team'].includes(w));

                            const isAligned = activeInitiatives.some(init => keywords.some(k => init.includes(k)));

                            if (!isAligned && keywords.length > 0) {
                                realityCheck.push({
                                    id: `check-${m.id}-${keywords[0]}`,
                                    type: 'disconnect',
                                    title: 'Potential Disconnect',
                                    message: `Team decided "${d}", but no matching engineering initiative was detected this week.`,
                                    severity: 'Medium',
                                    sourceMeeting: m.title
                                });
                            }
                        }
                    });
                }
            });
        }

        // 6. Action Items Count (from meetings)
        let totalActionItems = 0;
        let openActionItems = 0;
        const recentActionItems: any[] = [];

        for (const meeting of rangeMeetings) {
            if (meeting.actionItemsJson) {
                try {
                    const items = JSON.parse(meeting.actionItemsJson);
                    if (Array.isArray(items)) {
                        totalActionItems += items.length;

                        // Count ALL open items (not just first 3)
                        items.forEach((item: any, idx: number) => {
                            const title = typeof item === 'string' ? item : item.description || item.item || item.title || item.action;
                            const completed = typeof item === 'object' ? (item.completed === true || item.status === 'completed' || item.status === 'done') : false;

                            if (!completed) {
                                openActionItems++;
                            }

                            // Only add to recentActionItems for display (limit to 5 total)
                            if (recentActionItems.length < 5) {
                                recentActionItems.push({
                                    id: `ai-${meeting.id}-${idx}`,
                                    title: title?.substring(0, 80),
                                    source: meeting.title,
                                    completed,
                                    date: meeting.startTime.toISOString()
                                });
                            }
                        });
                    }
                } catch (e) { }
            }
        }

        // 7. Stakeholder Count
        const stakeholderCount = await this.prisma.stakeholder.count({
            where: { userId }
        });

        // 8. In Progress Tasks - Tasks from meetings/Slack that team is working on
        // This includes: open tasks ONLY (action items must be converted to tasks first)
        const inProgressTasks = tasksRaw.filter(t =>
            t.status === 'open' || t.status === 'in-progress' || t.status === 'in_progress' || t.status === 'pending'
        ).length;

        const result = {
            lastSyncedAt: lastSync?.finishedAt?.toISOString() || null,
            people,
            tasks,
            meetings,
            updates,
            githubIntelligence,
            totalDecisions,
            totalBlockers,
            totalActionItems,
            openActionItems,
            recentActionItems,
            inProgressTasks,
            stakeholderCount,
            realityCheck, // New AI Insight Field
            focusTasks: [],
            blockers: [],
            teamStats: [],
            teamMembers: []
        };

        // Cache the result
        this.dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });
        console.log(`[Dashboard] Cached data for ${userId}`);

        return result;
    }
    async generateWeekReport(userId: string) {
        const data = await this.getDashboardData(userId, 'week');

        let report = `# Weekly Report - ${new Date().toLocaleDateString()}\n\n`;

        // Executive Summary
        report += `## Executive Summary\n`;
        report += `This week, you completed ${data.tasks.filter(t => t.status === 'completed' || t.status === 'Done').length} tasks and attended ${data.meetings.length} meetings.\n`;
        report += `Active Blockers: ${data.totalBlockers}\n\n`;

        // Accomplishments
        report += `## Accomplishments\n`;
        const completedTasks = data.tasks.filter(t => t.status === 'completed' || t.status === 'Done');
        if (completedTasks.length > 0) {
            completedTasks.forEach(t => {
                report += `- [x] ${t.title}\n`;
            });
        } else {
            report += `No tasks completed yet.\n`;
        }
        report += `\n`;

        // Meetings & Decisions
        report += `## Key Meetings & Decisions\n`;
        if (data.meetings.length > 0) {
            data.meetings.forEach(m => {
                report += `### ${m.title} (${new Date(m.startTime).toLocaleDateString()})\n`;
                if (m.decisions && m.decisions.length > 0) {
                    report += `**Decisions:**\n`;
                    m.decisions.forEach((d: string) => report += `- ${d}\n`);
                }
                if (m.blockers && m.blockers.length > 0) {
                    report += `**Blockers Raised:**\n`;
                    m.blockers.forEach((b: string) => report += `- ${b}\n`);
                }
                report += `\n`;
            });
        } else {
            report += `No meetings recorded.\n\n`;
        }

        // Risks/Blockers
        report += `## Risks & Blockers\n`;
        if (data.updates.length > 0) {
            data.updates.filter(u => u.severity === 'High').forEach(u => {
                report += `- [URGENT] ${u.text} (${u.source})\n`;
            });
        }
        if (data.totalBlockers === 0 && data.updates.length === 0) {
            report += `No active risks identified.\n`;
        }

        return report;
    }

    async exportReportToDocs(userId: string, content: string, title?: string) {
        const token = await this.integrationsService.getDecryptedToken(userId, 'google_docs');
        if (!token) {
            throw new Error('Google Docs not connected. Please connect in Settings > Integrations.');
        }

        const provider = this.integrationsService.getProvider('google_docs') as any; // Cast to avoid TS issues if interface doesn't match yet
        const docTitle = title || `Weekly Report - ${new Date().toLocaleDateString()}`;

        return await provider.createDocument(token, docTitle, content);
    }

    /**
     * UNIFIED INTELLIGENCE SUMMARY
     * The "magic" cross-source synthesis that brings everything together.
     * This is the killer feature that justifies the platform.
     */
    async getUnifiedIntelligence(userId: string, forceRefresh = false, repo?: string) {
        // Check cache first (unless force refresh)
        const cacheKey = `intelligence:${userId}:${repo || 'all'}`;
        const cached = this.dashboardCache.get(cacheKey);
        if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            console.log(`[Intelligence] Returning cached data for ${userId} (repo: ${repo || 'all'})`);
            return cached.data;
        }

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 1. Fetch from all sources in parallel
        const [meetings, checkins, dashboardData] = await Promise.all([
            // Meetings with decisions
            this.prisma.meeting.findMany({
                where: { userId, startTime: { gte: oneWeekAgo } },
                orderBy: { startTime: 'desc' },
                take: 10
            }),
            // Check-ins with responses
            this.prisma.scheduledQuestion.findMany({
                where: { userId },
                include: { responses: { orderBy: { createdAt: 'desc' }, take: 30 } },
                orderBy: { lastSentAt: 'desc' },
                take: 5
            }),
            // GitHub and other data
            this.getDashboardData(userId, 'week')
        ]);

        // 2. Extract key decisions from meetings
        const decisions: any[] = [];
        meetings.forEach(m => {
            if (m.decisionsJson) {
                try {
                    const parsed = JSON.parse(m.decisionsJson as string);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(d => {
                            decisions.push({
                                text: typeof d === 'string' ? d : d.text || d.text || d.decision,
                                meeting: m.title,
                                date: m.startTime
                            });
                        });
                    }
                } catch (e) { }
            }
        });

        // 3. Fetch team members for name resolution (from TeamMember table)
        const teamMembers = await this.prisma.teamMember.findMany({
            where: { userId }
        });
        const memberMap = new Map<string, string>();
        teamMembers.forEach(m => {
            if (m.externalId) {
                memberMap.set(m.externalId, m.name);
            }
        });

        // Always try to get names from Slack integration to ensure we have latest data
        try {
            const slackIntegration = await this.prisma.integrations.findUnique({
                where: { userId_provider: { userId, provider: 'slack' } }
            });
            if (slackIntegration) {
                const tokens = JSON.parse((this.integrationsService as any).encryption?.decrypt(slackIntegration.encryptedBlob) || '{}');
                if (tokens.access_token) {
                    const slackProvider = this.integrationsService.getProvider('slack') as any;
                    const syncResult = await slackProvider.syncData(userId, tokens);
                    if (syncResult.teamMembers) {
                        syncResult.teamMembers.forEach((m: any) => {
                            if (m.externalId && m.name) {
                                memberMap.set(m.externalId, m.name);
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to fetch Slack members for name resolution:', e.message);
        }

        console.log(`[Intelligence] MemberMap size: ${memberMap.size}`);
        if (memberMap.size > 0) {
            console.log(`[Intelligence] Member IDs in map:`, Array.from(memberMap.keys()).slice(0, 5));
        }

        // Helper to resolve Slack user ID to name
        const resolveName = (slackId: string | null) => {
            if (!slackId) return 'Unknown';
            const name = memberMap.get(slackId);
            if (!name) {
                console.log(`[Intelligence] Could not resolve name for slackId: ${slackId}`);
            }
            return name || slackId;
        };

        // 4. Extract team pulse from check-in responses
        const teamPulse: any[] = [];
        checkins.forEach(q => {
            if (q.responses.length > 0) {
                teamPulse.push({
                    question: q.title,
                    responses: q.responses.map(r => ({
                        user: resolveName(r.slackUser),
                        userId: r.slackUser,
                        text: r.text,
                        time: r.createdAt
                    }))
                });
            }
        });

        // 4. Extract GitHub activity summary
        const githubSummary = {
            weeklyBrief: dashboardData.githubIntelligence?.weeklyBrief || 'No GitHub activity this week',
            initiatives: dashboardData.githubIntelligence?.initiatives || [],
            metrics: dashboardData.githubIntelligence?.metrics || {}
        };

        const now = new Date();

        // Calculate recent commits count
        let commitsCount = 0;
        if (dashboardData.githubIntelligence?.rawData?.commits) {
            commitsCount = dashboardData.githubIntelligence.rawData.commits.filter((c: any) =>
                (now.getTime() - new Date(c.date).getTime()) <= 7 * 24 * 60 * 60 * 1000 &&
                (!repo || c.repo.includes(repo))
            ).length;
        }

        // Calculate merged PRs count
        let mergedPrsCount = 0;
        if (dashboardData.githubIntelligence?.rawData?.prs) {
            mergedPrsCount = dashboardData.githubIntelligence.rawData.prs.filter((p: any) =>
                p.merged && (now.getTime() - new Date(p.merged_at).getTime()) <= 7 * 24 * 60 * 60 * 1000 &&
                (!repo || p.repo.includes(repo))
            ).length;
        }

        // Calculate Active Repos & Contributors (Last 7 Days)
        let activeReposCount = 0;
        let contributorsCount = 0;
        if (dashboardData.githubIntelligence?.rawData?.commits) {
            const recentCommits = dashboardData.githubIntelligence.rawData.commits.filter((c: any) =>
                (now.getTime() - new Date(c.date).getTime()) <= 7 * 24 * 60 * 60 * 1000 &&
                (!repo || c.repo.includes(repo))
            );

            activeReposCount = new Set(recentCommits.map((c: any) => c.repo)).size;
            contributorsCount = new Set(recentCommits.map((c: any) => c.author)).size;
        }

        // 5. Create cross-reference insights (the magic!)
        const crossReferenceInsights: any[] = [];

        // Check if any decision keywords match GitHub initiatives
        const initiativeNames = (githubSummary.initiatives as any[])
            .map((i: any) => i.name?.toLowerCase() || '');

        decisions.forEach(d => {
            const decisionWords = d.text.toLowerCase().split(' ')
                .filter((w: string) => w.length > 4);

            initiativeNames.forEach(init => {
                if (decisionWords.some((w: string) => init.includes(w))) {
                    crossReferenceInsights.push({
                        type: 'decision_matched',
                        icon: '✅',
                        message: `Decision "${d.text.substring(0, 50)}..." aligns with GitHub work on "${init}"`,
                        source: d.meeting
                    });
                }
            });
        });

        // Check if team responses mention any initiatives
        teamPulse.forEach(q => {
            q.responses.forEach((r: any) => {
                const responseWords = r.text.toLowerCase().split(' ');
                initiativeNames.forEach(init => {
                    if (responseWords.some((w: string) => init.includes(w) && w.length > 3)) {
                        crossReferenceInsights.push({
                            type: 'team_aligned',
                            icon: '👥',
                            message: `Team member mentioned "${init}" in check-in response`,
                            source: q.question
                        });
                    }
                });
            });
        });

        // 6. Generate Executive Summary using patterns
        const summary = {
            meetingsThisWeek: meetings.length,
            decisionsCount: decisions.length,
            teamResponsesCount: teamPulse.reduce((acc, q) => acc + q.responses.length, 0),
            blockersCount: dashboardData.totalBlockers || 0,
            commitsCount,
            mergedPrsCount,
            activeReposCount,
            contributorsCount,
            githubActivity: githubSummary.metrics,
            crossReferenceCount: crossReferenceInsights.length
        };

        const result = {
            timestamp: new Date().toISOString(),
            summary,
            decisions: decisions.slice(0, 10),
            teamPulse: teamPulse.slice(0, 5),
            githubSummary,
            crossReferenceInsights: crossReferenceInsights.slice(0, 10),
            realityCheck: dashboardData.realityCheck || []
        };

        // Cache the result
        this.dashboardCache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
    }
}
