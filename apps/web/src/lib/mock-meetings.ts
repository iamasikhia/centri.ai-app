
import { Meeting } from '@/types/meeting';
import { addDays, subDays, subHours } from 'date-fns';

export const MOCK_MEETINGS: Meeting[] = [
    {
        id: 'm-1',
        title: 'Weekly Product Sync: Q3 Roadmap',
        date: subHours(new Date(), 2),
        durationMinutes: 45,
        source: 'Google Meet',
        type: 'Team Sync',
        status: 'processed',
        participants: [
            { name: 'Alice Chen', email: 'alice@acme.com', role: 'Head of Product' },
            { name: 'Bob Smith', email: 'bob@acme.com', role: 'CTO' },
            { name: 'Sarah Jones', email: 'sarah@acme.com', role: 'Lead Designer' }
        ],
        summary: 'The team reviewed the progress on the Q3 roadmap. Key discussions centered around the delay in the mobile app redesign and the resource allocation for the new API integration. It was agreed to de-scope the analytics dashboard to meet the launch deadline.',
        keyTakeaways: [
            'Mobile app redesign is delayed by 2 weeks due to backend constraints.',
            'API integration requires 2 more engineers.',
            'Analytics dashboard moved to Q4.'
        ],
        decisions: [
            { id: 'd-1', text: 'De-scope Analytics Dashboard from Q3 release.', timestamp: 600, category: 'Scope' },
            { id: 'd-2', text: 'Assign 2 additional backend engineers to API integration squad.', timestamp: 1200, category: 'Resourcing' }
        ],
        actionItems: [
            { id: 'a-1', description: 'Update Q3 Roadmap document with new scope', owner: 'Alice Chen', type: 'update-doc', status: 'pending', priority: 'high', dueDate: addDays(new Date(), 2) } as any,
            { id: 'a-2', description: 'Schedule meeting with Engineering Leads to re-shuffle resources', owner: 'Bob Smith', type: 'schedule-meeting', status: 'pending', priority: 'medium', dueDate: addDays(new Date(), 1) } as any,
            { id: 'a-3', description: 'Draft update email to stakeholders regarding delay', owner: 'Alice Chen', type: 'reach-out', status: 'pending', priority: 'high', dueDate: new Date() } as any
        ],
        followUps: [
            { id: 'f-1', targetPerson: 'Dave (Marketing)', reason: 'Inform about launch delay', suggestedMessage: 'Hi Dave, just a heads up that the mobile launch is shifting by 2 weeks. We dropped the analytics dashboard to keep it tight. Let\'s sync on comms.' }
        ],
        documents: [
            { id: 'doc-1', title: 'Q3 Product Roadmap', type: 'update', url: '#' },
            { id: 'doc-2', title: 'Mobile API Specs', type: 'reference', url: '#' }
        ],
        transcript: [
            { speaker: 'Alice Chen', timestamp: 0, text: 'Okay, let\'s get started. Main topic is Q3 status.' },
            { speaker: 'Bob Smith', timestamp: 30, text: 'We are hitting some blockers on the mobile backend.' },
            { speaker: 'Sarah Jones', timestamp: 45, text: 'Does that impact the design handoff?' },
            { speaker: 'Bob Smith', timestamp: 60, text: 'Not the handoff, but the implementation. We probably need to cut scope.' },
            { speaker: 'Alice Chen', timestamp: 90, text: 'What if we drop the analytics dashboard? That was nice-to-have.' },
            { speaker: 'Bob Smith', timestamp: 100, text: 'That would save us about 3 weeks. I think we should do that.', isHighlighted: true }
        ]
    },
    {
        id: 'm-2',
        title: 'User Interview: Fintech Dashboard',
        date: subDays(new Date(), 1),
        durationMinutes: 30,
        source: 'Zoom',
        type: '1:1',
        status: 'needs-review',
        participants: [
            { name: 'Alice Chen', email: 'alice@acme.com', role: 'Product Manager' },
            { name: 'John Doe', email: 'john@client.com', role: 'External User' }
        ],
        summary: 'User interview focused on the new reporting feature. John found the export flow confusing but loved the visualization widgets. He requested a way to schedule recurring reports via email.',
        keyTakeaways: [
            'Export flow needs UX refinement.',
            'Visualization widgets are a strong selling point.',
            'Recurring email reports is a high-demand feature.'
        ],
        decisions: [],
        actionItems: [
            { id: 'a-4', description: 'Create ticket for Recurring Reports feature', owner: 'Alice Chen', type: 'create-doc', status: 'pending', priority: 'medium' } as any,
            { id: 'a-5', description: 'Share recording with Design team', owner: 'Alice Chen', type: 'follow-up', status: 'completed', priority: 'low' } as any
        ],
        followUps: [],
        documents: [],
        transcript: [
            { speaker: 'Alice Chen', timestamp: 0, text: 'Thanks for joining, John. Can you show me how you use the export?' },
            { speaker: 'John Doe', timestamp: 20, text: 'Sure. I click here... wait, I expected a modal. It just downloaded a CSV directly.' },
            { speaker: 'Alice Chen', timestamp: 40, text: 'Interesting. You prefer a configuration step?' },
            { speaker: 'John Doe', timestamp: 50, text: 'Yes, I need to filter dates first.' }
        ]
    },
    {
        id: 'm-3',
        title: 'Design Review: Settings Page',
        date: subDays(new Date(), 3),
        durationMinutes: 60,
        source: 'Upload',
        type: 'Team Sync',
        status: 'processed',
        participants: [
            { name: 'Sarah Jones', email: 'sarah@acme.com', role: 'Lead Designer' },
            { name: 'Mike Ross', email: 'mike@acme.com', role: 'Frontend Dev' }
        ],
        summary: 'Review of high-fidelity mocks for the new Settings page. Mike confirmed feasible implementation for the dark mode toggle but flagged potential issues with the nested notifications layout.',
        keyTakeaways: ['Dark mode toggle is feasible.', 'Nested notifications UI needs simplification.'],
        decisions: [{ id: 'd-3', text: 'Flatten notification settings to single level.', timestamp: 1500 }],
        actionItems: [],
        followUps: [],
        documents: [],
        transcript: []
    }
];
