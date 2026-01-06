export type Priority = 'Low' | 'Medium' | 'High';
export type CommunicationChannel = 'Email' | 'Slack' | 'Call' | 'Meeting';
export type FrequencyUnit = 'Days' | 'Weeks' | 'Months';

export interface ReachOutFrequency {
    value: number;
    unit: FrequencyUnit;
}

export type RelationshipType = 'Manager' | 'Engineer' | 'Exec' | 'External Partner' | 'Other';

export interface Stakeholder {
    id: string;
    name: string;
    role: string;
    organization: string;
    email: string;
    relationship: RelationshipType;
    priority: Priority;
    preferredChannel: CommunicationChannel;
    frequency: ReachOutFrequency;
    lastContactedAt?: Date;
    nextReachOutAt: Date;
    notes?: string;
}

export type StakeholderStatus = 'on-track' | 'due-soon' | 'overdue';
