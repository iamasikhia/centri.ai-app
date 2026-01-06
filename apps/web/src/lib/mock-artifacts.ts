import { Artifact } from '@/types/chat';

export const MOCK_PRD_ARTIFACT: Artifact = {
    type: 'prd',
    content: {
        title: 'AI-Powered Task Manager',
        problem: 'Users struggle to prioritize tasks effectively due to information overload from Slack, Email, and Jira, leading to missed deadlines and burnout.',
        goals: [
            'Reduce time spent on task prioritization by 50%',
            'Increase task completion rate by 20%',
            'Achieve 90% user satisfaction with AI recommendations'
        ],
        personas: [
            { role: 'Product Manager', description: 'Juggles multiple projects and needs a consolidated view of blockers.' },
            { role: 'Software Engineer', description: 'Needs to focus on coding without constant context switching.' }
        ],
        userStories: [
            { id: 'US-1', story: 'As a PM, I want to see a unified list of tasks from all tools so I can track progress.', priority: 'High' },
            { id: 'US-2', story: 'As a user, I want AI to suggest priority based on deadlines so I don\'t miss important deliverables.', priority: 'High' },
            { id: 'US-3', story: 'As a dev, I want to snooze tasks until tomorrow so I can focus on deep work.', priority: 'Medium' }
        ],
        functionalRequirements: [
            'Integrate with Slack API to fetch saved messages',
            'Integrate with Jira Cloud API for ticket sync',
            'Implement AI priority scoring algorithm',
            'Bi-directional sync for status updates'
        ],
        nonFunctionalRequirements: [
            'Response time under 200ms for list rendering',
            '99.9% uptime',
            'End-to-end encryption for user data'
        ],
        risks: [
            'API rate limits from third-party providers',
            'AI hallucinations recommending wrong priorities'
        ]
    }
};

export const MOCK_ARCH_ARTIFACT: Artifact = {
    type: 'architecture',
    content: {
        title: 'Task Sync Architecture',
        description: 'High-level system design showing the data flow from integrations to the AI processing engine and the frontend client.',
        mermaidCode: `graph TD
    Client[Web Client]
    API[API Gateway]
    Auth[Auth Service]
    Sync[Sync Worker]
    DB[(PostgreSQL)]
    Queue[Redis Queue]
    AI[AI Engine]
    
    subgraph Integrations
        Slack
        Jira
        GitHub
    end

    Client --> API
    API --> Auth
    API --> DB
    
    Sync --> Queue
    Queue --> Start[Job Processor]
    Start --> Slack
    Start --> Jira
    Start --> GitHub
    
    Start -- Normalized Data --> AI
    AI -- Priority Score --> DB
    
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style AI fill:#bbf,stroke:#333,stroke-width:2px
    style DB fill:#bfb,stroke:#333,stroke-width:2px`
    }
};
