
export type MeetingStatus = 'processed' | 'needs-review' | 'new' | 'processing' | 'failed';
export type MeetingSource = 'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Upload' | 'Integration';
export type MeetingType = '1:1' | 'Team Sync' | 'Stakeholder Review' | 'Sales Call' | 'Workshop';
export type ActionType = 'follow-up' | 'create-doc' | 'schedule-meeting' | 'reach-out';

export interface Participant {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
}

export interface Decision {
    id: string;
    text: string;
    timestamp?: number; // seconds from start
    category?: string;
}

export interface ActionItem {
    id: string;
    description: string;
    owner: string | 'Unassigned';
    dueDate?: Date;
    type: ActionType;
    status: 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
}

export interface FollowUp {
    id: string;
    targetPerson: string;
    reason: string;
    suggestedMessage: string;
}

export interface DocumentReference {
    id: string;
    title: string;
    type: 'create' | 'update' | 'reference';
    url?: string;
}

export interface TranscriptSegment {
    speaker: string;
    text: string;
    timestamp: number;
    isHighlighted?: boolean;
}

export interface Meeting {
    id: string;
    title: string;
    date: Date;
    durationMinutes: number;
    participants: Participant[];
    source: MeetingSource;
    type: MeetingType;
    status: MeetingStatus;

    // AI Intelligence
    summary: string;
    keyTakeaways: string[];
    decisions: Decision[];
    actionItems: ActionItem[];
    followUps: FollowUp[];
    documents: DocumentReference[];

    transcript: TranscriptSegment[];
}
