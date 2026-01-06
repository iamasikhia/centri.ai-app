export type CompanyStage = 'Startup' | 'Scaleup' | 'Enterprise' | 'All';

export interface Tool {
    id: string;
    name: string;
    logo?: string;
    primaryUse: string;
    commonScenario: string;
    bestForStage: CompanyStage[];
    website?: string;
    rating?: number; // Out of 5
    reviewCount?: number;
    pricing?: 'Free' | 'Freemium' | 'Paid' | 'Enterprise';
}

export interface Category {
    id: string;
    name: string;
    description: string;
    tools: Tool[];
}

export const pmToolsData: Category[] = [
    {
        id: 'discovery',
        name: 'Product Discovery & Research',
        description: 'Tools for understanding user needs, validating ideas, and conducting market research before building.',
        tools: [
            {
                id: 'dovetail',
                name: 'Dovetail',
                logo: 'https://assets-global.website-files.com/5d3e265ac89f6a0e19b3d9d5/5d3e265ac89f6a9c54b3da1f_dovetail-logo.svg',
                primaryUse: 'User research repository and analysis',
                commonScenario: 'Organizing interview transcripts, tagging insights, and synthesizing patterns across user research',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.6,
                reviewCount: 850,
                pricing: 'Paid',
                website: 'https://dovetail.com'
            },
            {
                id: 'maze',
                name: 'Maze',
                logo: 'https://maze.co/favicon.svg',
                primaryUse: 'Rapid user testing and prototype validation',
                commonScenario: 'Testing design prototypes with users before development, gathering quantitative usability metrics',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.4,
                reviewCount: 420,
                pricing: 'Freemium',
                website: 'https://maze.co'
            },
            {
                id: 'usertesting',
                name: 'UserTesting',
                logo: 'https://www.usertesting.com/sites/default/files/2021-03/UT_Logo_Horizontal_RGB.svg',
                primaryUse: 'On-demand user feedback and video sessions',
                commonScenario: 'Getting quick feedback on designs or live products from target users',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 680,
                pricing: 'Enterprise',
                website: 'https://usertesting.com'
            },
            {
                id: 'amplitude-discover',
                name: 'Amplitude (Discover)',
                logo: 'https://amplitude.com/favicon.svg',
                primaryUse: 'Behavioral analytics for discovery',
                commonScenario: 'Identifying usage patterns and drop-off points to inform what to build next',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 1200,
                pricing: 'Freemium',
                website: 'https://amplitude.com'
            },
            {
                id: 'miro',
                name: 'Miro',
                logo: 'https://miro.com/static/images/page/mr-logo.svg',
                primaryUse: 'Collaborative whiteboarding and workshops',
                commonScenario: 'Running discovery workshops, journey mapping, and affinity diagramming with stakeholders',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 4500,
                pricing: 'Freemium',
                website: 'https://miro.com'
            },
            {
                id: 'typeform',
                name: 'Typeform',
                logo: 'https://www.typeform.com/static/images/typeform-logo.svg',
                primaryUse: 'User surveys and feedback collection',
                commonScenario: 'Creating engaging surveys to validate assumptions or gather feature requests',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 2100,
                pricing: 'Freemium',
                website: 'https://typeform.com'
            }
        ]
    },
    {
        id: 'customer-discovery',
        name: 'Customer Discovery',
        description: 'Tools for conducting customer interviews, discovery calls, and validating problems before building solutions.',
        tools: [
            {
                id: 'calendly',
                name: 'Calendly',
                logo: 'https://assets.calendly.com/assets/frontend/media/logo-square-cd364a3c26e1b6b6c1a9.png',
                primaryUse: 'Scheduling customer interviews',
                commonScenario: 'Setting up discovery calls with potential customers without email back-and-forth',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 6800,
                pricing: 'Freemium',
                website: 'https://calendly.com'
            },
            {
                id: 'apollo',
                name: 'Apollo.io',
                logo: 'https://apollo.io/favicon.svg',
                primaryUse: 'Finding and reaching potential customers',
                commonScenario: 'Building lists of target customers for discovery outreach and scheduling interviews',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 5200,
                pricing: 'Freemium',
                website: 'https://apollo.io'
            },
            {
                id: 'grain',
                name: 'Grain',
                logo: 'https://grain.com/favicon.svg',
                primaryUse: 'AI meeting recording and highlights',
                commonScenario: 'Recording customer calls and automatically extracting key insights and quotes',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 520,
                pricing: 'Freemium',
                website: 'https://grain.com'
            },
            {
                id: 'respondent',
                name: 'Respondent',
                logo: 'https://www.respondent.io/favicon.svg',
                primaryUse: 'Recruiting research participants',
                commonScenario: 'Finding and scheduling interviews with your target customer segment',
                bestForStage: ['Startup', 'Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 890,
                pricing: 'Paid',
                website: 'https://respondent.io'
            },
            {
                id: 'userinterviews',
                name: 'User Interviews',
                logo: 'https://www.userinterviews.com/favicon.svg',
                primaryUse: 'Participant recruitment platform',
                commonScenario: 'Building a panel of customers for ongoing discovery research',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 680,
                pricing: 'Paid',
                website: 'https://userinterviews.com'
            },
            {
                id: 'rewatch',
                name: 'Rewatch',
                logo: 'https://rewatch.com/favicon.svg',
                primaryUse: 'Video collaboration and library',
                commonScenario: 'Creating a searchable library of customer interview recordings',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 420,
                pricing: 'Paid',
                website: 'https://rewatch.com'
            },
            {
                id: 'descript',
                name: 'Descript',
                logo: 'https://www.descript.com/favicon.svg',
                primaryUse: 'Audio/video editing and transcription',
                commonScenario: 'Transcribing customer interviews and creating highlight reels',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 2100,
                pricing: 'Freemium',
                website: 'https://descript.com'
            },
            {
                id: 'supernormal',
                name: 'Supernormal',
                logo: 'https://supernormal.com/favicon.svg',
                primaryUse: 'AI meeting notes',
                commonScenario: 'Automatically generating structured notes from customer discovery calls',
                bestForStage: ['All'],
                rating: 4.5,
                reviewCount: 380,
                pricing: 'Freemium',
                website: 'https://supernormal.com'
            },
            {
                id: 'notion-templates',
                name: 'Notion (Interview Templates)',
                logo: 'https://www.notion.so/images/logo-ios.png',
                primaryUse: 'Interview guide templates',
                commonScenario: 'Creating structured interview guides and storing customer insights',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 5200,
                pricing: 'Freemium',
                website: 'https://notion.so'
            }
        ]
    },
    {
        id: 'roadmapping',
        name: 'Roadmapping & Strategy',
        description: 'Tools for planning product direction, prioritizing initiatives, and communicating strategy.',
        tools: [
            {
                id: 'productboard',
                name: 'ProductBoard',
                logo: 'https://www.productboard.com/wp-content/themes/productboard/assets/img/logo.svg',
                primaryUse: 'Product roadmapping and prioritization',
                commonScenario: 'Collecting feature requests, scoring them against strategy, and building visual roadmaps',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 950,
                pricing: 'Paid',
                website: 'https://productboard.com'
            },
            {
                id: 'aha',
                name: 'Aha!',
                logo: 'https://www.aha.io/icons/icon-512x512.png',
                primaryUse: 'Strategic roadmapping and release planning',
                commonScenario: 'Creating multi-quarter roadmaps aligned to business goals and OKRs',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 1100,
                pricing: 'Paid',
                website: 'https://aha.io'
            },
            {
                id: 'airfocus',
                name: 'Airfocus',
                logo: 'https://airfocus.com/wp-content/themes/airfocus/assets/img/logo.svg',
                primaryUse: 'Modular roadmapping and prioritization',
                commonScenario: 'Building flexible roadmaps with custom prioritization frameworks (RICE, Value vs Effort)',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.4,
                reviewCount: 380,
                pricing: 'Paid',
                website: 'https://airfocus.com'
            },
            {
                id: 'notion',
                name: 'Notion',
                logo: 'https://www.notion.so/images/logo-ios.png',
                primaryUse: 'Flexible docs and lightweight roadmaps',
                commonScenario: 'Creating living strategy docs, simple roadmaps, and team wikis',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.7,
                reviewCount: 5200,
                pricing: 'Freemium',
                website: 'https://notion.so'
            },
            {
                id: 'coda',
                name: 'Coda',
                logo: 'https://coda.io/favicon.svg',
                primaryUse: 'Interactive docs with database capabilities',
                commonScenario: 'Building custom roadmap views with formulas, automations, and linked data',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 1400,
                pricing: 'Freemium',
                website: 'https://coda.io'
            },
            {
                id: 'craft',
                name: 'Craft.io',
                logo: 'https://craft.io/favicon.svg',
                primaryUse: 'Product management platform',
                commonScenario: 'End-to-end product planning from strategy to delivery tracking',
                bestForStage: ['Enterprise'],
                rating: 4.2,
                reviewCount: 180,
                pricing: 'Enterprise',
                website: 'https://craft.io'
            }
        ]
    },
    {
        id: 'documentation',
        name: 'PRD & Documentation',
        description: 'Tools for writing product requirements, specifications, and maintaining product knowledge.',
        tools: [
            {
                id: 'confluence',
                name: 'Confluence',
                logo: 'https://wac-cdn.atlassian.com/dam/jcr:5d1374c2-276f-4bca-9ce4-813aba614b7a/confluence-icon-gradient-blue.svg',
                primaryUse: 'Team wiki and documentation hub',
                commonScenario: 'Writing PRDs, maintaining product specs, and creating a single source of truth',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.1,
                reviewCount: 3800,
                pricing: 'Paid',
                website: 'https://atlassian.com/confluence'
            },
            {
                id: 'notion-docs',
                name: 'Notion',
                logo: 'https://www.notion.so/images/logo-ios.png',
                primaryUse: 'Collaborative documentation',
                commonScenario: 'Writing lightweight PRDs, creating product wikis, and organizing knowledge',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.7,
                reviewCount: 5200,
                pricing: 'Freemium',
                website: 'https://notion.so'
            },
            {
                id: 'google-docs',
                name: 'Google Docs',
                logo: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
                primaryUse: 'Real-time collaborative writing',
                commonScenario: 'Drafting PRDs with real-time stakeholder input and comments',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 8500,
                pricing: 'Free',
                website: 'https://docs.google.com'
            },
            {
                id: 'slite',
                name: 'Slite',
                logo: 'https://slite.com/favicon.svg',
                primaryUse: 'Team knowledge base',
                commonScenario: 'Creating structured product documentation with easy navigation',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 420,
                pricing: 'Freemium',
                website: 'https://slite.com'
            },
            {
                id: 'nuclino',
                name: 'Nuclino',
                logo: 'https://www.nuclino.com/img/logo.svg',
                primaryUse: 'Lightweight team wiki',
                commonScenario: 'Building interconnected product docs with visual knowledge graphs',
                bestForStage: ['Startup'],
                rating: 4.6,
                reviewCount: 280,
                pricing: 'Freemium',
                website: 'https://nuclino.com'
            },
            {
                id: 'gitbook',
                name: 'GitBook',
                logo: 'https://www.gitbook.com/public/images/logo.svg',
                primaryUse: 'Technical documentation',
                commonScenario: 'Creating public-facing product docs and internal technical specs',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 650,
                pricing: 'Freemium',
                website: 'https://gitbook.com'
            }
        ]
    },
    {
        id: 'design',
        name: 'Design Collaboration',
        description: 'Tools for working with designers, reviewing mockups, and managing design systems.',
        tools: [
            {
                id: 'figma',
                name: 'Figma',
                logo: 'https://static.figma.com/app/icon/1/favicon.svg',
                primaryUse: 'Design collaboration and prototyping',
                commonScenario: 'Reviewing designs, leaving feedback, and understanding user flows before development',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 6200,
                pricing: 'Freemium',
                website: 'https://figma.com'
            },
            {
                id: 'figjam',
                name: 'FigJam',
                logo: 'https://static.figma.com/app/icon/1/favicon.svg',
                primaryUse: 'Collaborative whiteboarding',
                commonScenario: 'Brainstorming features, user flows, and workshop facilitation with design teams',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 1800,
                pricing: 'Freemium',
                website: 'https://figma.com/figjam'
            },
            {
                id: 'zeplin',
                name: 'Zeplin',
                logo: 'https://zeplin.io/img/favicon/favicon-96x96.png',
                primaryUse: 'Design handoff and specs',
                commonScenario: 'Bridging design and development with precise specs and assets',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 890,
                pricing: 'Paid',
                website: 'https://zeplin.io'
            },
            {
                id: 'abstract',
                name: 'Abstract',
                logo: 'https://assets.abstract.com/images/favicon.svg',
                primaryUse: 'Design version control',
                commonScenario: 'Managing design file versions and reviewing design iterations',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 520,
                pricing: 'Paid',
                website: 'https://abstract.com'
            },
            {
                id: 'loom',
                name: 'Loom',
                logo: 'https://cdn.loom.com/assets/favicons/favicon-96x96.png',
                primaryUse: 'Async video feedback',
                commonScenario: 'Recording design walkthroughs and providing context-rich feedback',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 3400,
                pricing: 'Freemium',
                website: 'https://loom.com'
            }
        ]
    },
    {
        id: 'delivery',
        name: 'Delivery & Sprint Management',
        description: 'Tools for managing development sprints, tracking progress, and coordinating with engineering.',
        tools: [
            {
                id: 'jira',
                name: 'Jira',
                logo: 'https://wac-cdn.atlassian.com/dam/jcr:e33efd9e-e0f8-4d61-a24d-149ca6e0c3e5/jira-software-icon-gradient-blue.svg',
                primaryUse: 'Agile project management',
                commonScenario: 'Managing sprints, tracking tickets, and coordinating with engineering teams',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 5600,
                pricing: 'Paid',
                website: 'https://atlassian.com/jira'
            },
            {
                id: 'linear',
                name: 'Linear',
                logo: 'https://asset.brandfetch.io/idZAyF9rlg/idm22kWNaH.svg',
                primaryUse: 'Modern issue tracking',
                commonScenario: 'Fast, keyboard-driven sprint planning and issue management',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 1200,
                pricing: 'Paid',
                website: 'https://linear.app'
            },
            {
                id: 'asana',
                name: 'Asana',
                logo: 'https://luna1.co/asana.svg',
                primaryUse: 'Work management and task tracking',
                commonScenario: 'Coordinating cross-functional work and tracking deliverables',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.4,
                reviewCount: 9200,
                pricing: 'Freemium',
                website: 'https://asana.com'
            },
            {
                id: 'clickup',
                name: 'ClickUp',
                logo: 'https://clickup.com/landing/images/logo-clickup_color.svg',
                primaryUse: 'All-in-one project management',
                commonScenario: 'Managing everything from roadmaps to sprints in one platform',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.7,
                reviewCount: 4100,
                pricing: 'Freemium',
                website: 'https://clickup.com'
            },
            {
                id: 'shortcut',
                name: 'Shortcut',
                logo: 'https://shortcut.com/images/shortcut-icon.svg',
                primaryUse: 'Software project management',
                commonScenario: 'Planning iterations and tracking engineering work with minimal overhead',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 420,
                pricing: 'Paid',
                website: 'https://shortcut.com'
            },
            {
                id: 'github-projects',
                name: 'GitHub Projects',
                logo: 'https://github.githubassets.com/favicons/favicon.svg',
                primaryUse: 'Code-integrated project tracking',
                commonScenario: 'Managing work directly alongside code repositories',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.4,
                reviewCount: 2800,
                pricing: 'Free',
                website: 'https://github.com/features/issues'
            }
        ]
    },
    {
        id: 'communication',
        name: 'Stakeholder Communication',
        description: 'Tools for keeping stakeholders informed, running meetings, and managing alignment.',
        tools: [
            {
                id: 'slack',
                name: 'Slack',
                logo: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
                primaryUse: 'Team messaging and updates',
                commonScenario: 'Sharing quick updates, coordinating with teams, and maintaining product channels',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 18000,
                pricing: 'Freemium',
                website: 'https://slack.com'
            },
            {
                id: 'loom-comm',
                name: 'Loom',
                logo: 'https://cdn.loom.com/assets/favicons/favicon-96x96.png',
                primaryUse: 'Async video updates',
                commonScenario: 'Recording product demos, sprint reviews, and stakeholder updates',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 3400,
                pricing: 'Freemium',
                website: 'https://loom.com'
            },
            {
                id: 'zoom',
                name: 'Zoom',
                logo: 'https://st1.zoom.us/static/6.3.21969/image/new/ZoomLogo.png',
                primaryUse: 'Video meetings',
                commonScenario: 'Running sprint planning, stakeholder reviews, and user interviews',
                bestForStage: ['All'],
                rating: 4.5,
                reviewCount: 12000,
                pricing: 'Freemium',
                website: 'https://zoom.us'
            },
            {
                id: 'mmhmm',
                name: 'mmhmm',
                logo: 'https://www.mmhmm.app/favicon.svg',
                primaryUse: 'Enhanced video presentations',
                commonScenario: 'Creating polished product demos and stakeholder presentations',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.2,
                reviewCount: 180,
                pricing: 'Paid',
                website: 'https://mmhmm.app'
            },
            {
                id: 'gamma',
                name: 'Gamma',
                logo: 'https://gamma.app/favicon.svg',
                primaryUse: 'AI-powered presentations',
                commonScenario: 'Quickly creating product update decks and strategy presentations',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 520,
                pricing: 'Freemium',
                website: 'https://gamma.app'
            },
            {
                id: 'pitch',
                name: 'Pitch',
                logo: 'https://pitch.com/img/favicon.svg',
                primaryUse: 'Collaborative presentation software',
                commonScenario: 'Building beautiful stakeholder decks with team collaboration',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 680,
                pricing: 'Freemium',
                website: 'https://pitch.com'
            }
        ]
    },
    {
        id: 'analytics',
        name: 'Analytics & Experimentation',
        description: 'Tools for measuring product performance, running experiments, and making data-driven decisions.',
        tools: [
            {
                id: 'amplitude',
                name: 'Amplitude',
                logo: 'https://amplitude.com/favicon.svg',
                primaryUse: 'Product analytics',
                commonScenario: 'Tracking user behavior, building funnels, and measuring feature adoption',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 1200,
                pricing: 'Freemium',
                website: 'https://amplitude.com'
            },
            {
                id: 'mixpanel',
                name: 'Mixpanel',
                logo: 'https://mixpanel.com/wp-content/themes/mixpanel/assets/img/logo.svg',
                primaryUse: 'Event-based analytics',
                commonScenario: 'Analyzing user actions, retention cohorts, and conversion metrics',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 980,
                pricing: 'Freemium',
                website: 'https://mixpanel.com'
            },
            {
                id: 'posthog',
                name: 'PostHog',
                logo: 'https://posthog.com/brand/posthog-logo.svg',
                primaryUse: 'Open-source product analytics',
                commonScenario: 'Self-hosted analytics with session replay and feature flags',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 420,
                pricing: 'Freemium',
                website: 'https://posthog.com'
            },
            {
                id: 'heap',
                name: 'Heap',
                logo: 'https://heap.io/favicon.svg',
                primaryUse: 'Auto-capture analytics',
                commonScenario: 'Retroactive analysis without manual event tracking',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 680,
                pricing: 'Paid',
                website: 'https://heap.io'
            },
            {
                id: 'optimizely',
                name: 'Optimizely',
                logo: 'https://www.optimizely.com/contentassets/d4b8c1b6e6f84f5e9f8f8f8f8f8f8f8f/optimizely-logo.svg',
                primaryUse: 'A/B testing and experimentation',
                commonScenario: 'Running controlled experiments to validate product changes',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 850,
                pricing: 'Enterprise',
                website: 'https://optimizely.com'
            },
            {
                id: 'launchdarkly',
                name: 'LaunchDarkly',
                logo: 'https://launchdarkly.com/static/images/logo.svg',
                primaryUse: 'Feature flags and rollouts',
                commonScenario: 'Gradually releasing features and running targeted experiments',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.6,
                reviewCount: 520,
                pricing: 'Paid',
                website: 'https://launchdarkly.com'
            },
            {
                id: 'google-analytics',
                name: 'Google Analytics',
                logo: 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg',
                primaryUse: 'Web analytics',
                commonScenario: 'Understanding traffic sources, user demographics, and site performance',
                bestForStage: ['All'],
                rating: 4.4,
                reviewCount: 6500,
                pricing: 'Free',
                website: 'https://analytics.google.com'
            }
        ]
    },
    {
        id: 'feedback',
        name: 'Customer Feedback & Support',
        description: 'Tools for collecting user feedback, managing support tickets, and staying close to customers.',
        tools: [
            {
                id: 'intercom',
                name: 'Intercom',
                logo: 'https://marketing.intercomassets.com/assets/images/favicons/favicon-96x96.png',
                primaryUse: 'Customer messaging and support',
                commonScenario: 'Talking to users in-app, collecting feedback, and providing support',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 2800,
                pricing: 'Paid',
                website: 'https://intercom.com'
            },
            {
                id: 'zendesk',
                name: 'Zendesk',
                logo: 'https://d1eipm3vz40hy0.cloudfront.net/images/logos/zendesk-logo.svg',
                primaryUse: 'Customer support ticketing',
                commonScenario: 'Managing support requests and identifying product issues from tickets',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 5200,
                pricing: 'Paid',
                website: 'https://zendesk.com'
            },
            {
                id: 'pendo',
                name: 'Pendo',
                logo: 'https://www.pendo.io/wp-content/themes/pendo/assets/img/pendo-logo.svg',
                primaryUse: 'In-app guidance and feedback',
                commonScenario: 'Collecting NPS, showing feature announcements, and gathering contextual feedback',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 780,
                pricing: 'Enterprise',
                website: 'https://pendo.io'
            },
            {
                id: 'hotjar',
                name: 'Hotjar',
                logo: 'https://www.hotjar.com/images/favicons/favicon-96x96.png',
                primaryUse: 'Heatmaps and session recordings',
                commonScenario: 'Understanding how users interact with features through visual analytics',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.3,
                reviewCount: 2100,
                pricing: 'Freemium',
                website: 'https://hotjar.com'
            },
            {
                id: 'canny',
                name: 'Canny',
                logo: 'https://canny.io/images/logo.svg',
                primaryUse: 'Feature request management',
                commonScenario: 'Collecting, organizing, and prioritizing user feature requests',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 420,
                pricing: 'Paid',
                website: 'https://canny.io'
            },
            {
                id: 'uservoice',
                name: 'UserVoice',
                logo: 'https://www.uservoice.com/wp-content/themes/uservoice/images/logo.svg',
                primaryUse: 'Customer feedback portal',
                commonScenario: 'Creating public roadmaps and letting users vote on features',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.2,
                reviewCount: 680,
                pricing: 'Paid',
                website: 'https://uservoice.com'
            },
            {
                id: 'fullstory',
                name: 'FullStory',
                logo: 'https://www.fullstory.com/favicon.svg',
                primaryUse: 'Session replay and analytics',
                commonScenario: 'Watching user sessions to understand friction points and bugs',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 850,
                pricing: 'Paid',
                website: 'https://fullstory.com'
            }
        ]
    },
    {
        id: 'gtm',
        name: 'Go-to-Market & Launch',
        description: 'Tools for coordinating launches, managing releases, and communicating product updates.',
        tools: [
            {
                id: 'productboard-portal',
                name: 'ProductBoard Portal',
                logo: 'https://www.productboard.com/wp-content/themes/productboard/assets/img/logo.svg',
                primaryUse: 'Public roadmap and changelog',
                commonScenario: 'Sharing what\'s coming next and announcing new releases to customers',
                bestForStage: ['Scaleup', 'Enterprise'],
                website: 'https://productboard.com'
            },
            {
                id: 'beamer',
                name: 'Beamer',
                logo: 'https://www.getbeamer.com/images/logo.svg',
                primaryUse: 'Product changelog and announcements',
                commonScenario: 'Notifying users of new features and updates in-app',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 320,
                pricing: 'Paid',
                website: 'https://getbeamer.com'
            },
            {
                id: 'chameleon',
                name: 'Chameleon',
                logo: 'https://www.chameleon.io/hubfs/chameleon-logo.svg',
                primaryUse: 'Product tours and onboarding',
                commonScenario: 'Creating guided tours for new feature launches',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.4,
                reviewCount: 280,
                pricing: 'Paid',
                website: 'https://chameleon.io'
            },
            {
                id: 'appcues',
                name: 'Appcues',
                logo: 'https://www.appcues.com/hubfs/appcues-logo.svg',
                primaryUse: 'User onboarding flows',
                commonScenario: 'Building no-code onboarding experiences for new features',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.5,
                reviewCount: 520,
                pricing: 'Paid',
                website: 'https://appcues.com'
            },
            {
                id: 'launchnotes',
                name: 'LaunchNotes',
                logo: 'https://launchnotes.com/images/logo.svg',
                primaryUse: 'Release communication',
                commonScenario: 'Coordinating cross-functional launch activities and announcements',
                bestForStage: ['Scaleup', 'Enterprise'],
                rating: 4.3,
                reviewCount: 180,
                pricing: 'Paid',
                website: 'https://launchnotes.com'
            },
            {
                id: 'headway',
                name: 'Headway',
                logo: 'https://headwayapp.co/images/logo.svg',
                primaryUse: 'Product changelog widget',
                commonScenario: 'Embedding a changelog directly in your product',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.6,
                reviewCount: 280,
                pricing: 'Paid',
                website: 'https://headwayapp.co'
            }
        ]
    },
    {
        id: 'ai-productivity',
        name: 'AI & Productivity Assistants',
        description: 'AI-powered tools for writing, research, automation, and accelerating PM workflows.',
        tools: [
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                logo: 'https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png',
                primaryUse: 'AI writing and brainstorming',
                commonScenario: 'Drafting PRDs, generating user stories, and brainstorming feature ideas',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 8500,
                pricing: 'Freemium',
                website: 'https://chat.openai.com'
            },
            {
                id: 'claude',
                name: 'Claude',
                logo: 'https://claude.ai/images/claude_app_icon.png',
                primaryUse: 'AI assistant for analysis',
                commonScenario: 'Analyzing user research, synthesizing feedback, and strategic thinking',
                bestForStage: ['All'],
                rating: 4.8,
                reviewCount: 2100,
                pricing: 'Freemium',
                website: 'https://claude.ai'
            },
            {
                id: 'notion-ai',
                name: 'Notion AI',
                logo: 'https://www.notion.so/images/logo-ios.png',
                primaryUse: 'AI-powered documentation',
                commonScenario: 'Auto-generating summaries, improving writing, and organizing notes',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 1800,
                pricing: 'Paid',
                website: 'https://notion.so/product/ai'
            },
            {
                id: 'otter',
                name: 'Otter.ai',
                logo: 'https://otter.ai/favicon.svg',
                primaryUse: 'Meeting transcription',
                commonScenario: 'Auto-transcribing user interviews and stakeholder meetings',
                bestForStage: ['All'],
                rating: 4.5,
                reviewCount: 1400,
                pricing: 'Freemium',
                website: 'https://otter.ai'
            },
            {
                id: 'fireflies',
                name: 'Fireflies.ai',
                logo: 'https://fireflies.ai/wp-content/uploads/2021/03/fireflies-logo.svg',
                primaryUse: 'AI meeting notes',
                commonScenario: 'Recording, transcribing, and summarizing product meetings',
                bestForStage: ['All'],
                rating: 4.5,
                reviewCount: 980,
                pricing: 'Freemium',
                website: 'https://fireflies.ai'
            },
            {
                id: 'mem',
                name: 'Mem',
                logo: 'https://mem.ai/favicon.svg',
                primaryUse: 'AI-powered note-taking',
                commonScenario: 'Capturing ideas and having AI surface relevant context',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.3,
                reviewCount: 280,
                pricing: 'Paid',
                website: 'https://mem.ai'
            },
            {
                id: 'perplexity',
                name: 'Perplexity',
                logo: 'https://www.perplexity.ai/favicon.svg',
                primaryUse: 'AI research assistant',
                commonScenario: 'Researching competitors, market trends, and technical concepts',
                bestForStage: ['All'],
                rating: 4.6,
                reviewCount: 1200,
                pricing: 'Freemium',
                website: 'https://perplexity.ai'
            }
        ]
    },
    {
        id: 'ai-development',
        name: 'AI Powered Product Development',
        description: 'Tools utilizing AI to accelerate coding, design, and end-to-end product creation.',
        tools: [
            {
                id: 'cursor',
                name: 'Cursor',
                logo: 'https://cursor.sh/brand/icon.svg',
                primaryUse: 'AI Code Editor',
                commonScenario: 'Building and iterating on code faster with an AI-native editor',
                bestForStage: ['All'],
                rating: 4.9,
                reviewCount: 1500,
                pricing: 'Freemium',
                website: 'https://cursor.sh'
            },
            {
                id: 'v0',
                name: 'v0',
                logo: 'https://v0.dev/favicon.ico',
                primaryUse: 'Generative UI Design',
                commonScenario: 'Generating UI components and layouts from text prompts instantly',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.8,
                reviewCount: 950,
                pricing: 'Freemium',
                website: 'https://v0.dev'
            },
            {
                id: 'bolt',
                name: 'Bolt',
                logo: 'https://bolt.new/favicon.svg',
                primaryUse: 'In-browser AI Web Development',
                commonScenario: 'Prompting a full-stack web app into existence from a browser tab',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.7,
                reviewCount: 420,
                pricing: 'Paid',
                website: 'https://bolt.new'
            },
            {
                id: 'copilot',
                name: 'GitHub Copilot',
                logo: 'https://github.githubassets.com/assets/copilot-logo-6c615217e232.svg',
                primaryUse: 'AI Coding Assistant',
                commonScenario: 'Autocompleting code and generating functions within VS Code',
                bestForStage: ['All'],
                rating: 4.7,
                reviewCount: 5000,
                pricing: 'Paid',
                website: 'https://github.com/features/copilot'
            },
            {
                id: 'replit',
                name: 'Replit',
                logo: 'https://replit.com/public/images/favicon.ico',
                primaryUse: 'Collaborative AI IDE',
                commonScenario: 'Rapid prototyping and hosting apps with AI assistance',
                bestForStage: ['Startup', 'Scaleup'],
                rating: 4.5,
                reviewCount: 2200,
                pricing: 'Freemium',
                website: 'https://replit.com'
            },
            {
                id: 'midjourney',
                name: 'Midjourney',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Midjourney_Emblem.png',
                primaryUse: 'AI Image Generation',
                commonScenario: 'Creating high-fidelity assets, moodboards, and marketing visuals',
                bestForStage: ['All'],
                rating: 4.8,
                reviewCount: 3500,
                pricing: 'Paid',
                website: 'https://midjourney.com'
            },
            {
                id: 'lovable',
                name: 'Lovable',
                logo: 'https://lovable.dev/favicon.ico',
                primaryUse: 'AI-Powered Full-Stack Builder',
                commonScenario: 'Turning ideas into fully functional web apps with backend integration',
                bestForStage: ['Startup'],
                rating: 4.7,
                reviewCount: 150,
                pricing: 'Paid',
                website: 'https://lovable.dev'
            }
        ]
    }
];
