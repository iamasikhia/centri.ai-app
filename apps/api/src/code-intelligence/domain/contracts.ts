
/**
 * ONE-SOURCE OF TRUTH DATA CONTRACTS
 * 
 * These interfaces define the data flowing between the Intelligence Agents.
 * They are decoupled from any specific API (GitHub/Slack/OpenAI) to ensure extensibility.
 */

export enum ItemType {
    ISSUE = 'ISSUE',
    PR = 'PR',
}

export enum PriorityLevel {
    CRITICAL = 'CRITICAL', // Business stopping, P0
    HIGH = 'HIGH',         // Important feature or P1 bug
    MEDIUM = 'MEDIUM',     // Routine work
    LOW = 'LOW',           // Nice to have, polish
}

export enum Classification {
    BUG_CRITICAL = 'BUG_CRITICAL',
    BUG_MINOR = 'BUG_MINOR',
    FEATURE = 'FEATURE',
    TECH_DEBT = 'TECH_DEBT',
    DOCUMENTATION = 'DOCUMENTATION',
    SECURITY = 'SECURITY',
    UNCATEGORIZED = 'UNCATEGORIZED',
}

// Normalized Data from "Research Agent"
export interface GitHubItem {
    id: string; // Internal unique ID
    externalId: string; // GitHub ID
    type: ItemType;
    title: string;
    description: string;
    url: string;

    // Metadata
    author: string;
    assignees: string[];
    labels: string[];
    createdAt: Date;
    updatedAt: Date;

    // PR Specifics
    isDraft?: boolean;
    mergeStatus?: 'MERGED' | 'OPEN' | 'CLOSED' | 'CONFLICT';
    reviewStatus?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
    ciStatus?: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'UNKNOWN';
}

// Context from "Knowledge Agent"
export interface ProjectContext {
    currentSprintGoals: string[];
    criticalPaths: string[]; // e.g. "Payments", "Onboarding"
    onCallEngineer: string;
    teamFocusareas: Record<string, string[]>; // { "alice": ["frontend", "ui"], "bob": ["backend"] }
    userPreferences: {
        muteLowPriority: boolean;
        watchedLabels: string[];
    }
}

// Output from "Orchestration & Reasoning Layer"
export interface TriagedItem {
    originalItem: GitHubItem;

    // The Intelligence
    classification: Classification;
    priority: PriorityLevel;
    suggestedAssignee?: string;

    // Reasoning (Explainability)
    reasoning: string; // e.g. "Classified as CRITICAL because it mentions 'data loss' and is in 'Payments' module."
    requiresPMAttention: boolean;

    // Flags
    isStale: boolean;
    isBlocked: boolean;
}

// Output from "Summary Generator"
export interface DailyTriageBrief {
    date: Date;
    summary: string[]; // 3-5 executive bullets

    criticalAlerts: TriagedItem[];
    blockers: TriagedItem[];
    progressUpdates: TriagedItem[];

    stats: {
        totalOpen: number;
        newToday: number;
        closedToday: number;
    };
}

// Feedback Signal
export interface TriageFeedback {
    triageId: string;
    userId: string;
    action: 'CLICKED_LINK' | 'REPLIED_THREAD' | 'DISMISSED';
    timestamp: Date;
}
