
export type UIResponse = {
    kind: "ui_response";
    requestId: string;
    intent: Intent;
    title?: string;
    subtitle?: string;
    sessionTitle?: string;
    blocks: UIBlock[];
    debug?: {
        sourcesChecked: SourceCheck[];
        latencyMs?: number;
    };
    artifact?: Artifact;
};

export type Intent =
    | "get_team_members"
    | "get_next_meeting"
    | "get_meetings"
    | "get_todays_focus"
    | "get_blockers"
    | "get_task_health"
    | "is_next_meeting_physical"
    | "help_connect_integrations"
    | "generate_prd"
    | "generate_architecture"
    | "unknown";

export type Source = "google_calendar" | "slack" | "google_chat" | "jira" | "clickup";

export type SourceCheck = {
    source: Source;
    status: "connected" | "not_connected" | "checked_ok" | "checked_empty" | "error";
    itemCount?: number;
    message?: string;
};

export type UIBlock =
    | { type: "callout"; tone: "info" | "warning" | "danger" | "success"; title: string; body?: string; actions?: UIAction[] }
    | { type: "stat_row"; stats: { label: string; value: string; tone?: "neutral" | "good" | "warning" | "danger" }[] }
    | { type: "list"; title?: string; items: UIListItem[] }
    | { type: "table"; title?: string; columns: string[]; rows: (string | number)[][] }
    | { type: "chips"; title?: string; chips: { label: string; value?: string; tone?: "neutral" | "good" | "warning" | "danger" }[] }
    | { type: "event"; title: string; start: string; end: string; location?: string; attendees?: string[]; action?: UIAction }
    | { type: "divider" }
    | { type: "text"; markdown: string };

export type UIListItem = {
    title: string;
    subtitle?: string;
    meta?: string;
    badges?: { label: string; tone?: "neutral" | "good" | "warning" | "danger" }[];
    href?: string;
    avatarUrl?: string;
};

export type UIAction =
    | { type: "link"; label: string; href: string }
    | { type: "button"; label: string; action: "connect_integration" | "sync_now" | "open_url"; params?: Record<string, string> };

export type Artifact =
    | { type: "prd"; content: PRDData }
    | { type: "architecture"; content: ArchitectureData }
    | { type: "document"; content: string };

export interface PRDData {
    title: string;
    problem: string;
    goals: string[];
    personas: { role: string; description: string }[];
    userStories: { id: string; story: string; priority: 'High' | 'Medium' | 'Low' }[];
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
    risks: string[];
}

export interface ArchitectureData {
    title: string;
    mermaidCode: string;
    description: string;
}
