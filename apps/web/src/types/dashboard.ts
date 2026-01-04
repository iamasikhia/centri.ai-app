export interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    link?: string;
    status?: string;
}

export interface Task {
    id: string;
    title: string;
    assigneeEmail?: string;
    dueDate?: string;
    isBlocked: boolean;
    priority?: string;
}

export interface TeamStat {
    name: string;
    active: number;
    blocked: number;
    overdue: number;
}

export interface TeamMember {
    id: string;
    name: string;
    avatarUrl?: string;
    sourcesJson: string;
}

export interface DashboardData {
    focusTasks: Task[];
    blockers: Task[];
    meetings: Meeting[];
    teamStats: TeamStat[];
    teamMembers: TeamMember[];
}

export const emptyDashboardData: DashboardData = {
    focusTasks: [],
    blockers: [],
    meetings: [],
    teamStats: [],
    teamMembers: []
};
