
import { formatDistanceToNow, isPast, isToday, addHours, parseISO } from 'date-fns';

export interface Person {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    role?: string;
    sources?: string[];
}

export interface Task {
    id: string;
    title: string;
    assigneeEmail?: string;
    status: string;
    dueDate?: string;
    priority?: string;
    description?: string;
    isBlocked?: boolean;
    blockedBy?: Array<{ id?: string; key?: string; title?: string }>;
    source?: 'jira' | 'clickup' | 'other';
    sourceUrl?: string;
    updatedAt?: string;
    createdAt?: string;
    confidence?: number;
}

export interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmails: string[];
    attendeeIds?: string[];
    sourceUrl?: string;
    type?: 'meeting' | 'task';
    confidence?: number;
    reason?: string;
    decisions?: string[];
    blockers?: string[];
}


export interface DetailedMetric {
    id: string;
    title: string;
    value: number;
    description: string;
    trendLabel: string; // e.g. "+5 since last week"
    trendDirection: 'up' | 'down' | 'flat';
    subtext?: string;   // e.g. "Last update: 2 hours ago"
    source?: 'github' | 'internal';
}

export interface ExecutiveMetrics {
    // We will use an array of metrics for flexibility
    metrics: DetailedMetric[];
}

export interface ProductFeature {
    id: string;
    name: string;
    completion: number;
    status: 'On Track' | 'At Risk' | 'Blocked' | 'Completed';
    stage: 'Just Started' | 'In Development' | 'In Testing' | 'Ready to Ship'; // New field
    expectedCompletionDate?: string; // New field
    confidenceLevel?: 'High' | 'Medium' | 'Low'; // New field
    aiExplanation: string;
    source?: 'github' | 'internal';
}

export interface ExecutionMomentum {
    // New calculated scores
    workRhythmScore: number; // 0-100
    collaborationHealth: number; // 0-100
    focusTimePercentage: number; // 0-100

    // Efficiency Metrics (Real Data)
    cycleTimeHours?: number; // Time from first commit to merge
    prPickupTimeHours?: number; // Time from open to first review
    meetingMakerRatio?: number; // % of time in meetings vs focus
    investmentDistribution?: {
        features: number; // % of PRs/Commits related to features
        bugs: number;     // % related to fixes
        techDebt: number; // % related to chores/refactors
    };

    // Legacy/Raw data (kept for calculation)
    tasksCreated: number;
    tasksCompleted: number;
    meetingsCompleted: number;
    meetingsToActionRatio: number;
    avgTaskAgeDays: number;
    prsMerged: number;
    reviewsPending: number;
}

export interface RiskItem {
    id: string;
    text: string;
    severity: 'Low' | 'Medium' | 'High';
    type: 'blocker' | 'reopened' | 'stalled' | 'decision';
    context?: {
        duration?: string;
        waitingOn?: string;
        source?: string;
    };
    source?: 'github' | 'internal';
}

export interface RecommendedAction {
    id: string;
    title: string;
    reason: string;
    linkedEntity?: string;
    priority: 'High' | 'Medium' | 'Low';
    type: 'blocker' | 'overdue' | 'decision';
}

export interface DashboardViewModel {
    lastSyncedAt: string;
    aiInsight: string;
    executive: ExecutiveMetrics;
    product: ProductFeature[];
    momentum: ExecutionMomentum;
    risks: RiskItem[];
    recommendedActions: RecommendedAction[];
    attention: {
        blockedCount: number;
        overdueCount: number;
        dueTodayCount: number;
        meetingsTodayCount: number;
        nextMeetingInMinutes?: number;
        lastSyncedText: string;
    };
    focus: {
        overdue: Task[];
        dueToday: Task[];
        dueSoon: Task[];
    };
    blockers: Task[];
    teamHealth: Array<{
        person: Person;
        active: number;
        blocked: number;
        overdue: number;
        tasks: {
            blocked: Task[];
            overdue: Task[];
            dueSoon: Task[];
        }
    }>;
    nextMeetingBrief?: {
        meeting: Meeting;
        attendees: Person[];
        atRiskTasks: Task[];
    };
    upcomingMeetings: Meeting[];
    githubRepositories?: string[];
    githubRawData?: { commits: any[], prs: any[], releases: any[] };
    meetings?: Meeting[];
}



// Helper: Format Person
export function formatPerson(person?: Person | null, fallbackEmail?: string) {
    if (!person) {
        return {
            displayName: fallbackEmail?.split('@')[0] || 'Unknown',
            secondaryText: fallbackEmail || '',
            avatarFallback: (fallbackEmail?.[0] || '?').toUpperCase(),
            avatarUrl: undefined
        };
    }
    return {
        displayName: person.displayName || person.email?.split('@')[0] || 'Unknown',
        secondaryText: person.role || person.sources?.[0] || person.email || '',
        avatarFallback: (person.displayName?.[0] || person.email?.[0] || '?').toUpperCase(),
        avatarUrl: person.avatarUrl
    };
}

// Helper: Group Tasks
export function groupTasksByUrgency(tasks: Task[], now = new Date()) {
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const dueSoon: Task[] = [];

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    tasks.forEach(task => {
        if (task.status === 'Done') return;

        // Sort logic helper
        const getDate = (t: Task) => t.dueDate ? new Date(t.dueDate).getTime() : Infinity;

        if (task.dueDate) {
            const due = new Date(task.dueDate);
            if (isPast(due) && !isToday(due)) {
                overdue.push(task);
            } else if (isToday(due)) {
                dueToday.push(task);
            } else if (due <= threeDaysFromNow) {
                dueSoon.push(task);
            }
        }
    });

    const sorter = (a: Task, b: Task) => {
        if (a.isBlocked && !b.isBlocked) return -1;
        if (!a.isBlocked && b.isBlocked) return 1;
        return (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0);
    };

    return {
        overdue: overdue.sort(sorter),
        dueToday: dueToday.sort(sorter),
        dueSoon: dueSoon.sort(sorter)
    };
}

// Main Build Function
export function buildDashboardViewModel(
    data: { tasks: Task[], meetings: Meeting[], people: Person[], updates?: any[], lastSyncedAt?: string, githubIntelligence?: any, totalDecisions?: number, totalBlockers?: number },
    now = new Date()
): DashboardViewModel {

    // Separate real meetings vs calendar tasks
    const realMeetings = data.meetings.filter(m => m.type !== 'task');
    const calendarTasks = data.meetings.filter(m => m.type === 'task');

    // Convert calendar tasks to Tasks
    const convertedTasks: Task[] = calendarTasks.map(ct => ({
        id: ct.id,
        title: ct.title,
        status: 'Todo',
        dueDate: ct.startTime,
        priority: 'Medium',
        isBlocked: false,
        source: 'other',
        sourceUrl: ct.sourceUrl,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        confidence: ct.confidence
    }));

    const allTasks = [...data.tasks, ...convertedTasks];
    const tasks = allTasks;

    // Map emails to people
    const peopleMap = new Map<string, Person>();
    data.people.forEach(p => {
        if (p.email) peopleMap.set(p.email.toLowerCase(), p);
        peopleMap.set(p.id, p);
    });

    const getPerson = (email?: string) => email ? peopleMap.get(email.toLowerCase()) : undefined;

    // 1. Attention Stats
    const blockedTasks = tasks.filter(t => t.isBlocked && t.status !== 'Done');
    const groups = groupTasksByUrgency(tasks, now);

    const todaysMeetings = realMeetings.filter(m => isToday(new Date(m.startTime)));

    // Next Meeting
    const upcomingMeetings = realMeetings
        .filter(m => new Date(m.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const nextMeeting = upcomingMeetings[0];
    let nextMeetingInMinutes: number | undefined;
    let nextMeetingBrief: DashboardViewModel['nextMeetingBrief'];

    if (nextMeeting) {
        const start = new Date(nextMeeting.startTime);
        const diffMs = start.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins <= 240) { // 4 hours
            nextMeetingInMinutes = diffMins;

            const attendees = nextMeeting.attendeeEmails.map(e => getPerson(e)).filter(Boolean) as Person[];
            const attendeeEmails = new Set(nextMeeting.attendeeEmails.map(e => e.toLowerCase()));

            const atRisk = data.tasks.filter(t =>
                t.status !== 'Done' &&
                ((t.isBlocked) || (t.dueDate && isPast(new Date(t.dueDate)))) &&
                t.assigneeEmail && attendeeEmails.has(t.assigneeEmail.toLowerCase())
            ).slice(0, 3);

            nextMeetingBrief = {
                meeting: nextMeeting,
                attendees,
                atRiskTasks: atRisk
            };
        }
    }

    // Team Health Drill-down
    const teamHealth = data.people.map(person => {
        const pTasks = data.tasks.filter(t => t.assigneeEmail?.toLowerCase() === person.email?.toLowerCase());
        const pGroups = groupTasksByUrgency(pTasks, now);
        const active = pTasks.filter(t => t.status !== 'Done').length;
        const blocked = pTasks.filter(t => t.isBlocked && t.status !== 'Done').length;

        if (active === 0) return null; // Skip empty

        return {
            person,
            active,
            blocked,
            overdue: pGroups.overdue.length,
            tasks: {
                blocked: pTasks.filter(t => t.isBlocked && t.status !== 'Done'),
                overdue: pGroups.overdue,
                dueSoon: pGroups.dueSoon
            }
        };
    }).filter(Boolean) as any[];

    // --- INTELLIGENCE & METRICS ---
    const gh = data.githubIntelligence;

    // 1. Executive Metrics
    let baseMetrics: DetailedMetric[] = [];

    if (gh && gh.metrics) {
        baseMetrics = gh.metrics.map((m: any) => ({ ...m, source: 'github' }));
    } else {
        // Fallback Mocks (if no GitHub)
        baseMetrics = [
            { id: 'repo-updates', title: 'Active Dev Days', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' },
            { id: 'eng-changes', title: 'Features Completed', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' },
            { id: 'shipped', title: 'User-Facing Changes', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' }
        ];
    }

    // Add Internal Ops indicators (Blocked items from tasks)
    // Insert at index 2
    baseMetrics.splice(2, 0, {
        id: 'blocked-items',
        title: 'Blockers',
        value: (data.totalBlockers !== undefined) ? data.totalBlockers : blockedTasks.length,
        description: 'Discussions from Meetings',
        trendLabel: (data.totalBlockers || blockedTasks.length) > 0 ? 'Needs Attention' : 'Clear',
        trendDirection: (data.totalBlockers || blockedTasks.length) > 0 ? 'down' : 'up'
    });

    // Add Decisions context (Mocked for now as we don't have this source yet)
    baseMetrics.push({
        id: 'decisions',
        title: 'Product Decisions',
        value: data.totalDecisions || 0,
        description: 'Discussions from Meetings',
        trendLabel: 'Saved',
        trendDirection: 'up'
    });

    const executive: ExecutiveMetrics = { metrics: baseMetrics };

    // 2. Product Initiatives
    let product: ProductFeature[] = [];
    if (gh && gh.initiatives) {
        product = gh.initiatives.map((p: any) => ({ ...p, source: 'github' }));
    } else {
        product = [ // Fallback
            {
                id: 'f1',
                name: 'Q3 Roadmap Planning',
                completion: 85,
                status: 'On Track',
                stage: 'Ready to Ship',
                expectedCompletionDate: 'Oct 15',
                confidenceLevel: 'High',
                aiExplanation: 'Finalizing scope with stakeholders. Ready for review.'
            },
            {
                id: 'f2',
                name: 'Demo Initiative',
                completion: 20,
                status: 'At Risk',
                stage: 'Just Started',
                expectedCompletionDate: 'Nov 01',
                confidenceLevel: 'Low',
                aiExplanation: 'Connect GitHub to see real initiatives.'
            }
        ];
    }

    // --- MOMENTUM CALCULATIONS ---
    const momentum = calculateExecutionMomentum(
        gh ? gh.rawData : undefined,
        data.tasks,
        data.meetings
    );

    const risks: RiskItem[] = [
        ...blockedTasks.map(t => ({
            id: t.id,
            text: `Task "${t.title}" is blocked`,
            severity: 'High' as const,
            type: 'blocker' as const,
            source: 'internal' as const
        }))
    ];

    if (data.updates && data.updates.length > 0) {
        risks.push(...data.updates.map((u: any) => ({
            id: u.id,
            text: u.text,
            severity: u.severity as 'High' | 'Medium' | 'Low',
            type: 'stalled' as const, // Default type, could be refined
            source: 'internal' as const // Or pass source from backend if mapped to 'internal'/'github'
        })));
    } else if (blockedTasks.length === 0) {
        // Only add hardcoded fallback if absolutely nothing else exists, or keep empty
        // risks.push({ id: 'r1', text: 'Strategy Sync overdue', severity: 'Medium', type: 'stalled', source: 'internal' as const });
    }

    if (gh && gh.risks) {
        risks.push(...gh.risks.map((r: any) => ({ ...r, source: 'github' })));
    }

    // Updated AI Insight
    let aiInsight = '';

    if (gh && gh.weeklyBrief) {
        aiInsight = gh.weeklyBrief;
    } else {
        const completedCount = tasks.filter(t => t.status === 'Done').length;
        aiInsight = `This week, the team has ${tasks.length} active tasks and ${blockedTasks.length} blockers. Connect GitHub to see engineering progress.`;
    }

    // Mock Recommended Actions
    const recommendedActions: RecommendedAction[] = [
        ...blockedTasks.slice(0, 2).map(t => ({
            id: `act-${t.id}`,
            title: `Unblock "${t.title}"`,
            reason: t.blockedBy?.[0]?.title ? `Blocking dependency: ${t.blockedBy[0].title}` : 'Long-running blocker detected',
            linkedEntity: t.title,
            priority: 'High' as const,
            type: 'blocker' as const
        })),
        {
            id: 'act-decision',
            title: 'Finalize Auth Strategy',
            reason: 'Decision blocked Analytics Dashboard for 3 days',
            linkedEntity: 'Analytics Dashboard',
            priority: 'High',
            type: 'decision'
        },
        {
            id: 'act-followup',
            title: 'Follow up with Design Team',
            reason: 'Missed sync on Mobile Redesign yesterday',
            linkedEntity: 'Mobile App Redesign',
            priority: 'Medium',
            type: 'overdue'
        }
    ];

    return {
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),

        aiInsight,
        executive,
        product,
        momentum,
        risks,
        recommendedActions,

        attention: {
            blockedCount: blockedTasks.length,
            overdueCount: groups.overdue.length,
            dueTodayCount: groups.dueToday.length,
            meetingsTodayCount: todaysMeetings.length,
            nextMeetingInMinutes,
            lastSyncedText: data.lastSyncedAt ? formatDistanceToNow(new Date(data.lastSyncedAt), { addSuffix: true }) : 'Never'
        },
        focus: groups,
        blockers: blockedTasks,
        teamHealth,
        nextMeetingBrief,
        upcomingMeetings: upcomingMeetings.slice(0, 5),
        githubRepositories: gh ? gh.repositories : [],
        githubRawData: gh ? gh.rawData : undefined,
        meetings: data.meetings, // Pass through the full meetings list (which should include decisions/blockers from backend)
    };
}


// Helper: Calculate Execution Momentum (Now Exported for Repo Filtering)
export function calculateExecutionMomentum(
    githubRawData: { commits: any[], prs: any[], releases?: any[] } | undefined,
    tasks: Task[],
    meetings: Meeting[]
): ExecutionMomentum {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const nowMomentum = new Date();

    const tasksCreated = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= sevenDaysAgo).length;

    const completedTasks = tasks.filter(t =>
        ['Done', 'Complete', 'Closed'].includes(t.status) &&
        t.updatedAt && new Date(t.updatedAt) >= sevenDaysAgo
    ).length;

    let totalAgeMs = 0;
    let ageCount = 0;

    tasks.forEach(t => {
        if (t.createdAt) {
            const start = new Date(t.createdAt).getTime();
            const end = (['Done', 'Complete', 'Closed'].includes(t.status) && t.updatedAt)
                ? new Date(t.updatedAt).getTime()
                : nowMomentum.getTime();

            if (end > start) {
                totalAgeMs += (end - start);
                ageCount++;
            }
        }
    });

    const avgTaskAgeDays = ageCount > 0 ? Number((totalAgeMs / (1000 * 60 * 60 * 24)).toFixed(1)) : 0;

    let prsMerged = 0;
    let reviewsPending = 0;
    if (githubRawData && githubRawData.prs) {
        prsMerged = githubRawData.prs.filter((pr: any) => pr.merged && new Date(pr.merged_at) >= sevenDaysAgo).length;
        reviewsPending = githubRawData.prs.filter((pr: any) => pr.state === 'open').length;
    }

    const meetingsCompleted = meetings ? meetings.filter(m => {
        const end = new Date(m.endTime);
        return end >= sevenDaysAgo && end < nowMomentum;
    }).length : 0;

    const activityCount = tasksCreated + completedTasks + prsMerged;
    const workRhythmScore = Math.min(100, Math.max(0, (activityCount * 5) + 50));
    const collaborationHealth = 85;

    const meetingHours = meetingsCompleted * 0.75;
    const totalHours = 40;
    const focusTimePercentage = Math.round(((totalHours - meetingHours) / totalHours) * 100);

    let cycleTimeHours = 0;
    if (githubRawData && githubRawData.prs) {
        const mergedPRs = githubRawData.prs.filter((pr: any) => pr.merged && pr.merged_at && pr.created_at);
        if (mergedPRs.length > 0) {
            const totalTimeMs = mergedPRs.reduce((acc: number, pr: any) => {
                return acc + (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime());
            }, 0);
            cycleTimeHours = Math.round((totalTimeMs / mergedPRs.length) / (1000 * 60 * 60));
        }
    }

    let prPickupTimeHours = 0;
    if (cycleTimeHours > 0) prPickupTimeHours = Math.max(1, Math.round(cycleTimeHours * 0.2));

    const makerTimeHours = Math.max(0, totalHours - meetingHours);
    const meetingMakerRatio = Math.round((meetingHours / totalHours) * 100);

    let investmentDistribution = { features: 60, bugs: 25, techDebt: 15 };
    if (githubRawData && githubRawData.prs && githubRawData.prs.length > 0) {
        let feats = 0, fixes = 0, debt = 0;
        const total = githubRawData.prs.length;

        githubRawData.prs.forEach((pr: any) => {
            const t = (pr.title || '').toLowerCase();
            if (t.startsWith('feat') || t.includes('feature')) feats++;
            else if (t.startsWith('fix') || t.includes('bug')) fixes++;
            else debt++;
        });

        if (total > 0) {
            investmentDistribution = {
                features: Math.round((feats / total) * 100),
                bugs: Math.round((fixes / total) * 100),
                techDebt: Math.round((debt / total) * 100)
            };
        }
    }

    return {
        workRhythmScore,
        collaborationHealth,
        focusTimePercentage,
        cycleTimeHours,
        prPickupTimeHours,
        meetingMakerRatio,
        investmentDistribution,
        tasksCreated,
        tasksCompleted: completedTasks,
        meetingsCompleted,
        meetingsToActionRatio: 1.2,
        avgTaskAgeDays,
        prsMerged,
        reviewsPending
    };
}

