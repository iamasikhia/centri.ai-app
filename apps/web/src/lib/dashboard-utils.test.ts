
import { groupTasksByUrgency, computeAttentionStats, formatPerson } from './dashboard-utils'; // computeAttentionStats is integrated in buildDashboardViewModel but I can export it if needed or test the main function.
import { buildDashboardViewModel, Task, Meeting, Person } from './dashboard-utils';

// Mock Data
const now = new Date('2023-10-10T09:00:00Z');

const mockTasks: Task[] = [
    { id: '1', title: 'Overdue Task', status: 'In Progress', dueDate: '2023-10-08T09:00:00Z', isBlocked: false },
    { id: '2', title: 'Due Today Task', status: 'In Progress', dueDate: '2023-10-10T15:00:00Z', isBlocked: false },
    { id: '3', title: 'Future Task', status: 'In Progress', dueDate: '2023-10-12T09:00:00Z', isBlocked: false },
    { id: '4', title: 'Blocked Task', status: 'In Progress', isBlocked: true },
];

const mockMeetings: Meeting[] = [
    { id: 'm1', title: 'Meeting Today', startTime: '2023-10-10T10:00:00Z', endTime: '2023-10-10T10:30:00Z', attendeeEmails: [] }
];

const mockPeople: Person[] = [
    { id: 'p1', displayName: 'Alice', email: 'alice@example.com' }
];

// Tests (Pseudo-code structure since no runner)
describe('Dashboard Utils', () => {

    test('groupTasksByUrgency separates tasks correctly', () => {
        const groups = groupTasksByUrgency(mockTasks, now);
        if (groups.overdue.length !== 1) throw new Error('Overdue count wrong');
        if (groups.dueToday.length !== 1) throw new Error('Due Today count wrong');
        if (groups.dueSoon.length !== 1) throw new Error('Due Soon count wrong'); // 2023-10-12 is within 3 days
    });

    test('buildDashboardViewModel computes attention stats', () => {
        const vm = buildDashboardViewModel({
            tasks: mockTasks,
            meetings: mockMeetings,
            people: mockPeople,
            lastSyncedAt: now.toISOString()
        }, now);

        if (vm.attention.blockedCount !== 1) throw new Error('Blocked count wrong');
        if (vm.attention.overdueCount !== 1) throw new Error('Overdue count wrong');
        if (vm.attention.meetingsTodayCount !== 1) throw new Error('Meetings count wrong');
        if (vm.attention.nextMeetingInMinutes !== 60) throw new Error(`Next meeting minutes wrong: ${vm.attention.nextMeetingInMinutes}`);
    });

    test('formatPerson handles missing data', () => {
        const p = formatPerson(null, 'bob@example.com');
        if (p.displayName !== 'bob') throw new Error('Fallback display name wrong');
        if (p.avatarFallback !== 'B') throw new Error('Fallback initials wrong');
    });
});
