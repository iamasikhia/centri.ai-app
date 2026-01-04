
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
    isBlocked?: boolean;
    blockedBy?: Array<{ id?: string; key?: string; title?: string }>;
    source?: 'jira' | 'clickup' | 'other';
    sourceUrl?: string;
    updatedAt?: string;
    createdAt?: string;
}

export interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmails: string[];
    attendeeIds?: string[];
    sourceUrl?: string;
}

export interface DashboardViewModel {
    lastSyncedAt: string;
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
    blockers: Task[]; // Enriched with age
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
    upcomingMeetings: Meeting[]; // Rest of them
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
        // Note: If no due date but Blocked, maybe put in Focus? 
        // For now strict due date based.
    });

    // Sort: Blocked first, then Priority (High>Med>Low), then DueDate
    const sorter = (a: Task, b: Task) => {
        if (a.isBlocked && !b.isBlocked) return -1;
        if (!a.isBlocked && b.isBlocked) return 1;
        // Priority logic could go here
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
    data: { tasks: Task[], meetings: Meeting[], people: Person[], lastSyncedAt?: string },
    now = new Date()
): DashboardViewModel {

    // Map emails to people
    const peopleMap = new Map<string, Person>();
    data.people.forEach(p => {
        if (p.email) peopleMap.set(p.email.toLowerCase(), p);
        peopleMap.set(p.id, p);
    });

    const getPerson = (email?: string) => email ? peopleMap.get(email.toLowerCase()) : undefined;

    // 1. Attention Stats
    const blockedTasks = data.tasks.filter(t => t.isBlocked && t.status !== 'Done');
    const groups = groupTasksByUrgency(data.tasks, now);

    const todaysMeetings = data.meetings.filter(m => isToday(new Date(m.startTime)));

    // Next Meeting
    const upcomingMeetings = data.meetings
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

            // Tasks at risk: overdue or blocked tasks assigned to attendees
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

    return {
        lastSyncedAt: data.lastSyncedAt || new Date().toISOString(),
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
        upcomingMeetings: upcomingMeetings.slice(0, 5)
    };
}
