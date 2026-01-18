
export type OpportunityType = 'Grant' | 'Accelerator' | 'Fellowship' | 'Startup Program' | 'Venture Capital';
export type OpportunityStage = 'Idea' | 'MVP' | 'Pre-Seed' | 'Seed' | 'Growth' | 'All';

export interface FundingOpportunity {
    id: string;
    name: string;
    programName?: string; // Optional subtitle
    type: OpportunityType;
    amount: string; // Display text like "Up to $100k"
    description: string;
    fullDescription: string;
    whatItOffers: string[]; // List of benefits
    criteria: string[]; // Eligibility criteria
    stage: OpportunityStage[];
    location: string;
    deadline: string; // ISO date string or "Rolling"
    website: string;
    logo?: string; // Optional override
    equity?: string; // e.g. "Equity-free" or "7%"
    aiInsight?: string; // The "Who this is for" insight
    tags: string[];
}

export const fundingOpportunities: FundingOpportunity[] = [
    {
        id: 'yc',
        name: 'Y Combinator',
        type: 'Accelerator',
        amount: '$500,000',
        equity: '7% + MFN',
        description: 'The world’s most successful startup accelerator.',
        fullDescription: 'Y Combinator provides seed funding for startups. Seed funding is the earliest stage of venture funding. It pays your expenses while you’re getting started. Some companies may need no more than seed funding. Others may go through several rounds.',
        whatItOffers: [
            '$500k investment',
            '3-month intensive program',
            'Access to the YC alumni network',
            'Weekly dinners with industry experts'
        ],
        criteria: [
            'Ideally have technical co-founders',
            'Focus on high-growth potential',
            'Can be just an idea or a live product'
        ],
        stage: ['Idea', 'MVP', 'Pre-Seed'],
        location: 'San Francisco / Remote',
        deadline: '2026-04-05T23:59:59Z', // YC application deadline
        website: 'https://www.ycombinator.com',
        aiInsight: 'Best for ambitious founders looking for top-tier network and valuation. Highly competitive.',
        tags: ['Global', 'Tech', 'Prestitigious']
    },
    {
        id: 'techstars',
        name: 'Techstars',
        type: 'Accelerator',
        amount: '$120,000',
        equity: '6-9%',
        description: 'Global investment business that provides access to capital, one-on-one mentorship, and customized programming.',
        fullDescription: 'Techstars connects unstoppable founders, investors, corporations, and communities to help build companies. Each accelerator program lasts three months and culminates in a Demo Day.',
        whatItOffers: [
            '$20k equity in exchange for 6%',
            'Optional $100k convertible note',
            'Mentorship-driven accelerator'
        ],
        criteria: [
            'Team execution ability',
            'Market size potential',
            'Product traction'
        ],
        stage: ['MVP', 'Pre-Seed', 'Seed'],
        location: 'Global (Multiple Cities)',
        deadline: '2026-03-12T00:00:00Z',
        website: 'https://www.techstars.com',
        aiInsight: 'Great for founders who value hands-on mentorship and corporate partnerships specific to their vertical.',
        tags: ['Mentorship', 'Global', 'Vertical-Specific']
    },
    {
        id: 'aws-activate',
        name: 'AWS Activate',
        type: 'Startup Program',
        amount: 'Up to $100k Credits',
        equity: 'Equity-free',
        description: 'Credits, support, and training to help you build your business.',
        fullDescription: 'AWS Activate provides startups with a host of benefits, including AWS credits, AWS support plan credits, and training, to help grow your business. Activate is designed to provide you with the right mix of tools and expert advice.',
        whatItOffers: [
            'Up to $100,000 in AWS Cloud credits',
            'Technical support and training',
            'Go-to-market support'
        ],
        criteria: [
            'Unfunded or funded startups (Series A or earlier)',
            'Associated with an Activate Provider',
            'Have a company website'
        ],
        stage: ['MVP', 'Pre-Seed', 'Seed', 'Growth'],
        location: 'Global',
        deadline: 'Rolling',
        website: 'https://aws.amazon.com/activate/',
        aiInsight: 'Essential infrastructure grant for any SaaS or AI startup building on AWS. No strings attached.',
        tags: ['Infrastructure', 'Credits', 'SaaS']
    },
    {
        id: 'google-for-startups-black-founders',
        name: 'Google for Startups: Black Founders Fund',
        type: 'Grant',
        amount: '$150,000',
        equity: 'Equity-free',
        description: 'Cash awards to Black-led startups in Africa, Brazil, Europe, and the US.',
        fullDescription: 'The Black Founders Fund provides non-dilutive cash awards to Black-led startups that have participated in Google for Startups programs or have been nominated by partner communities.',
        whatItOffers: [
            '$150k non-dilutive cash',
            '$100k in Google Cloud credits',
            'Hands-on mentorship from Googlers'
        ],
        criteria: [
            'Black-founded startup',
            'Technology-based product',
            'Traction (revenue or users)'
        ],
        stage: ['Pre-Seed', 'Seed'],
        location: 'US / Europe / Africa / Brazil',
        deadline: '2026-04-10T00:00:00Z',
        website: 'https://www.campus.co/funds/black-founders-fund/',
        aiInsight: 'Highly valuable non-dilutive capital for underrepresented founders. Provides significant signal to other investors.',
        tags: ['Diversity', 'Grant', 'Impact']
    },
    {
        id: 'thiel-fellowship',
        name: 'Thiel Fellowship',
        type: 'Fellowship',
        amount: '$100,000',
        equity: 'Equity-free',
        description: 'A two-year program for young people who want to build new things instead of sitting in a classroom.',
        fullDescription: 'The Thiel Fellowship gives $100,000 to young people who want to build new things instead of sitting in a classroom. Thiel Fellows skip or stop out of college to receive a $100,000 grant and two years of support.',
        whatItOffers: [
            '$100k grant',
            '2 years of support',
            'Network of visionary founders'
        ],
        criteria: [
            'Age 22 or younger',
            'Must drop out of college',
            'Working on a bold idea'
        ],
        stage: ['Idea', 'MVP'],
        location: 'Global',
        deadline: 'Rolling',
        website: 'https://thielfellowship.org',
        aiInsight: 'High-risk, high-reward path for young founders. The network is arguably more valuable than the money.',
        tags: ['Young Founders', 'Prestigious', 'Hard Tech']
    },
    {
        id: 'stripe-atlas',
        name: 'Stripe Atlas',
        type: 'Startup Program',
        amount: 'Discounted Formation',
        equity: 'N/A',
        description: 'The easiest way to start an internet business.',
        fullDescription: 'Stripe Atlas helps you incorporate a US Delaware C Corporation or LLC. It handles the paperwork, bank account opening, and legal setup so you can start accepting payments from day one.',
        whatItOffers: [
            'Delaware C Corp incorporation',
            'US Bank Account setup',
            'Access to $100k in AWS credits'
        ],
        criteria: [
            'Anyone anywhere in the world',
            'Internet business'
        ],
        stage: ['Idea', 'MVP'],
        location: 'Global',
        deadline: 'Rolling',
        website: 'https://stripe.com/atlas',
        aiInsight: 'The standard for setting up a investable US entity from anywhere in the world. Recommended for global founders.',
        tags: ['Incorporation', 'Legal', 'US Entity']
    },
    {
        id: 'nvidia-inception',
        name: 'NVIDIA Inception',
        type: 'Startup Program',
        amount: 'H/W Discounts + Support',
        equity: 'Equity-free',
        description: 'Program for startups revolutionizing industries with advancements in AI and data science.',
        fullDescription: 'NVIDIA Inception is a free program designed to help your startup evolve faster through access to cutting-edge technology and NVIDIA experts, opportunities to connect with venture capitalists, and co-marketing support.',
        whatItOffers: [
            'Discounts on NVIDIA hardware',
            'Technical training (DLI)',
            'Go-to-market support'
        ],
        criteria: [
            'AI / Data Science focus',
            'Incorporated company',
            'Functional website'
        ],
        stage: ['MVP', 'Pre-Seed', 'Seed', 'Growth'],
        location: 'Global',
        deadline: 'Rolling',
        website: 'https://www.nvidia.com/en-us/startups/',
        aiInsight: 'Must-have for AI companies needing compute power. Provides credibility in the AI space.',
        tags: ['AI', 'Hardware', 'Deep Tech']
    },
    {
        id: 'antler-global',
        name: 'Antler',
        type: 'Venture Capital',
        amount: '$110k - $250k',
        equity: '10%',
        description: 'The world’s day zero investor. We help you find a co-founder and validate your idea.',
        fullDescription: 'Antler is a global early-stage venture capital firm that builds and invests in the defining technology companies of tomorrow. We have offices in 25 cities across six continents, including Singapore, London, Nairobi, and New York.',
        whatItOffers: [
            'Pre-seed investment',
            'Co-founder matching',
            'Global alumni network',
            'Stipend during the program'
        ],
        criteria: [
            'Driven individuals',
            'Domain expertise',
            'Willingness to commit full-time'
        ],
        stage: ['Idea', 'MVP'],
        location: 'Global (25+ Cities)',
        deadline: 'Rolling (Select your location)',
        website: 'https://www.antler.co',
        aiInsight: 'Perfect for solo founders looking for a co-founder. Highly active in SE Asia, Europe, and Africa.',
        tags: ['Co-founder Matching', 'Global', 'Day Zero']
    },
    {
        id: 'entrepreneur-first',
        name: 'Entrepreneur First',
        type: 'Venture Capital',
        amount: '£80,000 - £100,000',
        equity: '10%',
        description: 'The best place in the world to meet your co-founder and build a startup from scratch.',
        fullDescription: 'EF invests in individuals to build companies from scratch. We bring together extraordinary people to find a co-founder, develop an idea, and get funded. Major hubs in London, Paris, and Bangalore.',
        whatItOffers: [
            'Monthly stipend during formation',
            'Pre-seed investment',
            'Visa support (UK/France)'
        ],
        criteria: [
            'Technical or Domain Edge',
            'Pre-team / Pre-idea allowed'
        ],
        stage: ['Idea'],
        location: 'London / Paris / Bangalore',
        deadline: '2026-03-31T00:00:00Z',
        website: 'https://www.joinef.com',
        aiInsight: 'The gold standard for "Talent Investing" in Europe and India. Focuses heavily on deep tech and talent density.',
        tags: ['Talent Investor', 'Europe', 'India', 'Deep Tech']
    },
    {
        id: 'startup-chile',
        name: 'Start-Up Chile',
        type: 'Accelerator',
        amount: 'Up to $75k Equity-Free',
        equity: 'Equity-free',
        description: 'The leading accelerator in LATAM. Equity-free funding to build your startup in Chile.',
        fullDescription: 'Start-Up Chile (SUP) is a public startup accelerator created by the Chilean Government. It provides equity-free grants to attract world-class entrepreneurs to do business in Chile.',
        whatItOffers: [
            'Up to $75k USD equity-free',
            '1-year work visa',
            'Free co-working space'
        ],
        criteria: [
            'Global mindset',
            'Scalable product',
            'Founder must reside in Chile for the program'
        ],
        stage: ['MVP', 'Pre-Seed'],
        location: 'Santiago, Chile',
        deadline: '2026-04-15T00:00:00Z',
        website: 'https://startupchile.org',
        aiInsight: 'One of the best equity-free deals in the world. Ideal for those wanting to enter the LATAM market.',
        tags: ['LATAM', 'Equity-Free', 'Government Grant']
    }
];
