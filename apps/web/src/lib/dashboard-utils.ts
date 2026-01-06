
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
    status: 'On Track' | 'At Risk' | 'Blocked';
    aiExplanation: string;
    source?: 'github' | 'internal';
}

export interface ExecutionMomentum {
    tasksCreated: number;
    tasksCompleted: number;
    meetingsCompleted: number; // New field
    meetingsToActionRatio: number; // e.g. 1.5
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
    data: { tasks: Task[], meetings: Meeting[], people: Person[], lastSyncedAt?: string, githubIntelligence?: any },
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
            { id: 'repo-updates', title: 'Repository Updates', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' },
            { id: 'eng-changes', title: 'Engineering Changes', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' },
            { id: 'shipped', title: 'Product Updates Shipped', value: 0, description: 'No data connected', trendLabel: '-', trendDirection: 'flat' }
        ];
    }

    // Add Internal Ops indicators (Blocked items from tasks)
    // Insert at index 2
    baseMetrics.splice(2, 0, {
        id: 'blocked-items',
        title: 'Blocked Items',
        value: blockedTasks.length,
        description: 'Work that cannot progress without intervention',
        trendLabel: blockedTasks.length > 0 ? 'Needs Attention' : 'Clear',
        trendDirection: blockedTasks.length > 0 ? 'down' : 'up'
    });

    // Add Decisions context (Mocked for now as we don't have this source yet)
    baseMetrics.push({
        id: 'decisions',
        title: 'Product Decisions',
        value: 4,
        description: 'Decisions finalized in meetings',
        trendLabel: 'Stable',
        trendDirection: 'flat'
    });

    const executive: ExecutiveMetrics = { metrics: baseMetrics };

    // 2. Product Initiatives
    let product: ProductFeature[] = [];
    if (gh && gh.initiatives) {
        product = gh.initiatives.map((p: any) => ({ ...p, source: 'github' }));
    } else {
        product = [ // Fallback
            { id: 'f1', name: 'Q3 Roadmap Planning', completion: 85, status: 'On Track', aiExplanation: 'Finalizing scope with stakeholders.' },
            { id: 'f2', name: 'Demo Initiative', completion: 20, status: 'At Risk', aiExplanation: 'Connect GitHub to see real initiatives.' }
        ];
    }

    // Calulate Momentum from Real Data
    const momentumTasks = data.tasks;
    const totalTasks = momentumTasks.length;
    const completedTasks = momentumTasks.filter(t => ['Done', 'Complete', 'Closed'].includes(t.status)).length;

    let totalAgeMs = 0;
    let ageCount = 0;
    const nowMomentum = new Date();

    momentumTasks.forEach(t => {
        if (t.createdAt) {
            const start = new Date(t.createdAt).getTime();
            // If done, use updated time as end, else use now. 
            // If updated is missing, fall back to now (or ignore).
            const end = (['Done', 'Complete', 'Closed'].includes(t.status) && t.updatedAt)
                ? new Date(t.updatedAt).getTime()
                : nowMomentum.getTime();

            if (end > start) {
                totalAgeMs += (end - start);
                ageCount++;
            }
        }
    });

    const avgAge = ageCount > 0 ? Number((totalAgeMs / (1000 * 60 * 60 * 24)).toFixed(1)) : 0;

    let prsMerged = 0;
    let reviewsPending = 0;
    if (gh && gh.rawData && gh.rawData.prs) {
        prsMerged = gh.rawData.prs.filter((pr: any) => pr.merged).length;
        reviewsPending = gh.rawData.prs.filter((pr: any) => pr.state === 'open').length;
    }

    const meetingsCompleted = data.meetings ? data.meetings.filter(m => new Date(m.endTime) < nowMomentum).length : 0;

    const momentum: ExecutionMomentum = {
        tasksCreated: totalTasks,
        tasksCompleted: completedTasks,
        meetingsCompleted: meetingsCompleted,
        meetingsToActionRatio: 1.2,
        avgTaskAgeDays: avgAge,
        prsMerged: prsMerged,
        reviewsPending: reviewsPending
    };

    const risks: RiskItem[] = [
        ...blockedTasks.map(t => ({
            id: t.id,
            text: `Task "${t.title}" is blocked`,
            severity: 'High' as const,
            type: 'blocker' as const,
            source: 'internal' as const
        })),
        { id: 'r1', text: 'Strategy Sync overdue', severity: 'Medium', type: 'stalled', source: 'internal' as const }
    ];

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
        githubRawData: gh ? gh.rawData : undefined
    };
}

