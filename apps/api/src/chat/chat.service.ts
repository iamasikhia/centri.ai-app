import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { DashboardService } from '../dashboard/dashboard.service';

// Types matching the JSON structure requested
export interface ChatResponse {
    answer: string;
    citations: Array<{ source: string; type: string; count?: number; link?: string }>;
    insights: string[];
    actions: Array<{ label: string; type: string; uri?: string }>;
    followUps: string[];
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    data?: any;
    createdAt: Date;
}

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    private openai: OpenAI;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private integrationsService: IntegrationsService,
        private dashboardService: DashboardService
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        }
    }

    // --- Persistence Methods ---

    async getConversations(userId: string): Promise<Conversation[]> {
        return this.prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, createdAt: true, updatedAt: true }
        }) as unknown as Conversation[];
    }

    async getConversationMessages(conversationId: string, userId: string): Promise<Message[]> {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation || conversation.userId !== userId) {
            throw new Error('Conversation not found or access denied');
        }

        return this.prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, role: true, content: true, data: true, createdAt: true }
        }) as unknown as Message[];
    }

    async createConversation(userId: string, title?: string, id?: string): Promise<Conversation> {
        // Ensure user exists before creating conversation
        const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            // Create the default user if missing
            await this.prisma.user.create({
                data: {
                    id: userId,
                    email: `${userId}@example.com`, // Fallback email
                    name: 'Default User'
                }
            });
        }

        return this.prisma.conversation.create({
            data: {
                id: id, // Optional custom ID
                userId,
                title: title || 'New Chat'
            }
        }) as unknown as Conversation;
    }

    async deleteConversation(conversationId: string, userId: string): Promise<void> {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (conversation && conversation.userId === userId) {
            await this.prisma.conversation.delete({ where: { id: conversationId } });
        }
    }

    async updateConversationTitle(conversationId: string, title: string): Promise<void> {
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { title }
        });
    }

    // --- Core Logic ---

    async processQuery(userId: string, query: string, conversationId?: string): Promise<ChatResponse & { conversationId: string }> {
        try {
            if (!this.openai) {
                throw new Error('OpenAI API not configured');
            }

            // 1. Resolve Conversation ID
            let currentConversationId = conversationId;
            let isNewConversation = false;

            if (currentConversationId) {
                // Check if it exists
                const existing = await this.prisma.conversation.findUnique({ where: { id: currentConversationId } });
                if (!existing) {
                    // Create it with this ID
                    const title = query.length > 50 ? query.substring(0, 50) + '...' : query;
                    const newConv = await this.createConversation(userId, title, currentConversationId);
                    currentConversationId = newConv.id;
                    isNewConversation = true;
                }
            } else {
                // Determine ID (new random one)
                const title = query.length > 50 ? query.substring(0, 50) + '...' : query;
                const newConv = await this.createConversation(userId, title);
                currentConversationId = newConv.id;
                isNewConversation = true;
            }

            // 2. Load History (if existing conversation)
            let historyMessages: any[] = [];
            if (!isNewConversation) {
                const dbMessages = await this.getConversationMessages(currentConversationId!, userId);
                historyMessages = dbMessages.map(m => ({ role: m.role, content: m.content }));
            }

            // 3. Save User Message
            await this.prisma.chatMessage.create({
                data: {
                    conversationId: currentConversationId,
                    role: 'user',
                    content: query
                }
            });

            this.logger.log(`Processing query for user ${userId}: "${query}" (Conv: ${currentConversationId})`);

            // 4. Update Conversation Title (Async, for better UX)
            if (isNewConversation) {
                this.generateTitle(currentConversationId, query, userId).catch(err =>
                    this.logger.error('Failed to generate title', err)
                );
            }

            // 5. Fetch Context & Process with LLM
            const response = await this.generateResponse(userId, query, historyMessages);

            // 6. Save Assistant Message
            await this.prisma.chatMessage.create({
                data: {
                    conversationId: currentConversationId,
                    role: 'assistant',
                    content: response.answer, // Main text content
                    data: response as any // Store full structured response
                }
            });

            // Update UpdatedAt
            await this.prisma.conversation.update({
                where: { id: currentConversationId },
                data: { updatedAt: new Date() }
            });

            return { ...response, conversationId: currentConversationId };

        } catch (e) {
            this.logger.error(`Error processing query`, e);
            return {
                conversationId: conversationId || 'error',
                answer: "I encountered an error processing your request. Please try again.",
                citations: [],
                insights: [],
                actions: [],
                followUps: []
            };
        }
    }

    private async generateTitle(conversationId: string, firstMessage: string, userId: string) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'Generate a short, concise title (max 6 words) for a chat that starts with this message. Return ONLY the title text, nothing else.' },
                    { role: 'user', content: firstMessage }
                ],
                max_tokens: 20
            });
            const title = completion.choices[0].message.content?.trim().replace(/^"|"$/g, '');
            if (title) {
                await this.updateConversationTitle(conversationId, title);
            }
        } catch (e) {
            this.logger.warn('Title generation failed', e);
        }
    }

    async generateResponse(userId: string, query: string, history: any[] = []): Promise<ChatResponse> {
        this.logger.log(`Generatng response for query: "${query}"`);

        // 1. Fetch Context (Real Data Only)
        const context = await this.buildContext(userId, query);

        // Debug Log
        this.logger.log(`Context built with integrations: ${JSON.stringify(context.userContext.connected_integrations)}`);
        this.logger.log(`Real Data Keys found: ${Object.keys(context.integrationData).join(', ')}`);

        // Check if we needed data but got none
        // Check if we needed data but got none
        const topic = context.userContext.topic_detected;
        let hasRelevantData = false;

        if (topic === 'calendar') hasRelevantData = !!context.integrationData.google_calendar;
        else if (topic === 'slack') hasRelevantData = !!context.integrationData.slack;
        else if (topic === 'github') hasRelevantData = !!context.integrationData.github;
        else if (topic === 'email') hasRelevantData = !!context.integrationData.gmail;
        else if (topic === 'transcript') hasRelevantData = !!context.integrationData.fathom;
        else if (topic === 'dashboard') hasRelevantData = !!context.integrationData.dashboard;
        else hasRelevantData = true; // General topic doesn't strictly require data

        if (topic !== 'general' && !hasRelevantData) {
            // If specific intent but no data, check why
            const connected = context.userContext.connected_integrations;
            let neededProvider = '';

            if (topic === 'calendar') neededProvider = 'Google Calendar';
            else if (topic === 'github') neededProvider = 'GitHub';
            else if (topic === 'slack') neededProvider = 'Slack';
            else if (topic === 'email') neededProvider = 'Gmail';
            else if (topic === 'transcript') neededProvider = 'Fathom';

            // Only show connection error if we actually have a specific provider requirement that isn't met
            if (neededProvider && !connected.includes(neededProvider)) {
                return {
                    answer: `I can't check your ${topic} because **${neededProvider}** is not connected.`,
                    citations: [],
                    insights: [],
                    actions: [{ label: `Connect ${neededProvider}`, type: 'open_url', uri: '/settings/integrations' }],
                    followUps: []
                };
            }

            // If dashboard data is missing (internal error likely) or provider connected but no data
            if (topic === 'dashboard') {
                return {
                    answer: `I couldn't retrieve your dashboard data at the moment. Please try refreshing the page.`,
                    citations: [],
                    insights: [],
                    actions: [],
                    followUps: []
                };
            }

            // Connected but no data found (or error)
            return {
                answer: `I checked your **${neededProvider || topic}** but couldn't find any recent data matching your request.`,
                citations: [],
                insights: [],
                actions: [{ label: `Check Status`, type: 'open_url', uri: '/settings/integrations' }],
                followUps: []
            };
        }

        // 2. Construct System Prompt (Strict Real Data Only)
        const systemPrompt = `
You are Centri Co-Pilot, an AI assistant.

# CRITICAL RULES
1. **ONLY use data explicitly provided in the context below.**
2. **NEVER make up meetings, emails, or messages.**
3. **NEVER say "You might have..." or "Typically...".**
4. **If data is missing, explicitly say "I don't have access to that data".**
5. **Always cite the actual source using [Source Name].**
6. **Quote exact meeting titles, email subjects, and Slack messages.**
"You have 5 unread emails from @sarah [Gmail]. Your next 1:1 with her is tomorrow at 4pm [Google Calendar]. 
Last time you met (Dec 15), you discussed the API redesign based on your calendar history."

**Example 3: Fathom + GitHub + Calendar**
"Your last meeting 'Sprint Planning' on Jan 7 [Fathom] had these action items:
- Review PR #241 (OAuth implementation) - Currently in review [GitHub]
- Schedule design sync - Not yet on calendar [Google Calendar]

Would you like me to help schedule the design sync?"

# Response Format
Return a strictly valid JSON object:
{
  "answer": "Direct answer using ONLY provided data with inline citations [Source].",
  "citations": [{"source": "Source Name", "type": "calendar", "count": 1}],
  "insights": ["Pattern detected from data", "Connection between sources"],
  "actions": [{"label": "Action Name", "type": "open_url", "uri": "url"}],
  "followUps": ["Related question 1", "Related question 2"]
}

# Important Guidelines
- Use bullet points for lists
- Include specific times, dates, names from the data
- Highlight patterns (e.g., "You have 18 hours of meetings this week - higher than usual")
- Connect related information across sources
- Suggest actionable next steps
- Keep responses concise but informative
`;

        const userPrompt = `
User Query: "${query}"

REAL DATA FROM INTEGRATIONS (Use ONLY this):
${JSON.stringify(context.integrationData, null, 2)}

User Context: ${JSON.stringify(context.userContext)}

If the 'REAL DATA' object is empty or missing the requested info, explicitly state that you found nothing.
`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(msg => ({ role: msg.role, content: msg.content })),
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Lower temperature for factual accuracy
            });

            const content = completion.choices[0].message.content;
            return JSON.parse(content || '{}');

        } catch (e) {
            this.logger.error('Error processing chat query', e);
            return {
                answer: "I encountered an error analyzing your data. Please try again.",
                citations: [],
                insights: [],
                actions: [],
                followUps: []
            };
        }
    }

    private async buildContext(userId: string, query: string) {
        const topic = this.detectTopic(query);
        const integrationData: any = {};
        const connectedIntegrationsStr = [];

        this.logger.log(`Detecting context for topic: ${topic}`);

        const connections = await this.integrationsService.getIntegrationStatus(userId);
        const connectedProviders = connections.map(c => c.provider);
        this.logger.log(`User has connected providers: ${connectedProviders.join(', ')}`);

        // --- Google Calendar ---
        if ((topic === 'calendar' || topic === 'general') && connectedProviders.includes('google')) {
            try {
                this.logger.log('Fetching Google Calendar data...');
                let token = await this.integrationsService.getDecryptedToken(userId, 'google');
                if (token && token.access_token) {
                    const start = new Date().toISOString();
                    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                    let calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=10`, {
                        headers: { Authorization: `Bearer ${token.access_token}` }
                    });

                    // If 401, try to refresh the token
                    if (calRes.status === 401 && token.refresh_token) {
                        this.logger.log('Access token expired, refreshing...');
                        try {
                            const googleProvider = this.integrationsService.getProvider('google') as any;
                            const newTokens = await googleProvider.refreshTokens(token.refresh_token);

                            // Merge new tokens with existing (preserve refresh_token if not returned)
                            const updatedTokens = {
                                ...token,
                                ...newTokens,
                                refresh_token: newTokens.refresh_token || token.refresh_token
                            };

                            // Save the new tokens
                            await this.integrationsService.saveTokens('google', userId, updatedTokens);

                            // Retry the request with new token
                            calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=10`, {
                                headers: { Authorization: `Bearer ${updatedTokens.access_token}` }
                            });

                            this.logger.log('Token refreshed successfully');
                        } catch (refreshError) {
                            this.logger.error('Failed to refresh Google token', refreshError);
                        }
                    }

                    if (calRes.ok) {
                        const data = await calRes.json();
                        if (data.items && data.items.length > 0) {
                            integrationData.google_calendar = {
                                meetings: data.items.map((m: any) => ({
                                    title: m.summary,
                                    start: m.start.dateTime || m.start.date,
                                    end: m.end.dateTime || m.end.date,
                                    attendees: m.attendees?.map((a: any) => a.email) || [],
                                    link: m.htmlLink,
                                    status: m.status
                                }))
                            };
                            connectedIntegrationsStr.push('Google Calendar');
                            this.logger.log(`Found ${data.items.length} calendar events`);
                        } else {
                            this.logger.log('Google Calendar connected but returned 0 events');
                        }
                    } else {
                        const errText = await calRes.text();
                        this.logger.error(`Google Calendar API Error: ${calRes.status} ${errText}`);
                    }
                }
            } catch (e) {
                this.logger.error(`Exception fetching calendar for user ${userId}`, e);
            }
        }

        // --- Slack ---
        if ((topic === 'slack' || topic === 'general') && connectedProviders.includes('slack')) {
            try {
                this.logger.log('Fetching Slack data...');
                const token = await this.integrationsService.getDecryptedToken(userId, 'slack');
                if (token && token.access_token) {
                    const slackProvider = this.integrationsService.getProvider('slack') as any;

                    // Fetch only channels the user is a member of
                    const channelsRes = await fetch('https://slack.com/api/users.conversations?types=public_channel,private_channel&exclude_archived=true&limit=10', {
                        headers: { Authorization: `Bearer ${token.access_token}` }
                    });
                    const channelsData = await channelsRes.json();

                    if (channelsData.ok && channelsData.channels) {
                        const msgs = [];
                        for (const channel of channelsData.channels.slice(0, 3)) {
                            const history = await slackProvider.getHistory(token.access_token, channel.id, 3);
                            if (history.length > 0) {
                                msgs.push(...history.map((m: any) => ({
                                    channel: `#${channel.name}`,
                                    user: m.user,
                                    text: m.text,
                                    time: new Date(parseFloat(m.ts) * 1000).toISOString()
                                })));
                            }
                        }
                        if (msgs.length > 0) {
                            integrationData.slack = { recent_messages: msgs };
                            connectedIntegrationsStr.push('Slack');
                            this.logger.log(`Found ${msgs.length} Slack messages`);
                        } else {
                            this.logger.log('Slack connected but no messages found in recent channels');
                            // Still mark as connected even if no messages
                            connectedIntegrationsStr.push('Slack');
                        }
                    } else {
                        this.logger.error(`Slack API Error: ${JSON.stringify(channelsData)}`);
                        // If it's a rate limit, still mark as connected
                        if (channelsData.error === 'rate_limited') {
                            this.logger.warn('Slack rate limited, marking as connected anyway');
                            connectedIntegrationsStr.push('Slack');
                        }
                    }
                } else {
                    this.logger.warn('Slack token not found or missing access_token');
                }
            } catch (e) {
                this.logger.error(`Exception fetching slack for user ${userId}`, e);
                // Still mark as connected if we have the provider
                connectedIntegrationsStr.push('Slack');
            }
        }

        // --- GitHub ---
        if ((topic === 'github' || topic === 'general') && connectedProviders.includes('github')) {
            try {
                this.logger.log('Fetching GitHub data...');
                const token = await this.integrationsService.getDecryptedToken(userId, 'github');
                if (token && token.access_token) {
                    this.logger.log('GitHub token found, making API calls...');

                    // Fetch assigned issues
                    const issuesRes = await fetch('https://api.github.com/issues?filter=assigned&state=open&per_page=5', {
                        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                    });

                    // Fetch recent events (pushes, PRs, etc.)
                    const eventsRes = await fetch('https://api.github.com/users/user/events?per_page=10', {
                        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                    });

                    // Fetch Open PRs (authored by user OR requesting review)
                    const prsRes = await fetch(`https://api.github.com/search/issues?q=is:pr+state:open+archived:false+(author:@me+OR+user-review-requested:@me)&sort=updated&order=desc&per_page=5`, {
                        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                    });

                    // Fetch User Repositories
                    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10&type=owner', {
                        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                    });

                    const githubData: any = {
                        assigned_issues: [],
                        recent_pushes: [],
                        open_prs: [],
                        repositories: [],
                        search_results: {}
                    };

                    // --- INTELLIGENT SEARCH ---
                    // Attempt to find relevant items based on the user's query keywords
                    try {
                        // Simple keyword extraction: remove common stop words
                        const stopWords = ['show', 'me', 'my', 'the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'github', 'list', 'what', 'where', 'when', 'who', 'how', 'is', 'are'];
                        const keywords = query.split(' ')
                            .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
                            .filter(w => w.length > 2 && !stopWords.includes(w))
                            .join(' ');

                        if (keywords.length > 0) {
                            this.logger.log(`Performing GitHub search for keywords: "${keywords}"`);

                            // 1. Search Issues/PRs involving the user
                            const searchIssuesRes = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(keywords)}+involves:@me&per_page=3`, {
                                headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                            });

                            // 2. Search Repositories matching keywords
                            const searchReposRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(keywords)}+user:@me&per_page=3`, {
                                headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github.v3+json' }
                            });

                            if (searchIssuesRes.ok) {
                                const issueResults = await searchIssuesRes.json();
                                githubData.search_results.issues = issueResults.items?.map((i: any) => ({
                                    title: i.title,
                                    url: i.html_url,
                                    state: i.state,
                                    repo: i.repository_url?.split('/').slice(-2).join('/')
                                })) || [];
                            }

                            if (searchReposRes.ok) {
                                const repoResults = await searchReposRes.json();
                                githubData.search_results.repos = repoResults.items?.map((r: any) => ({
                                    name: r.full_name,
                                    url: r.html_url,
                                    description: r.description
                                })) || [];
                            }
                        }
                    } catch (searchErr) {
                        this.logger.warn(`GitHub search failed: ${searchErr.message}`);
                    }

                    if (issuesRes.ok) {
                        const issues = await issuesRes.json();
                        this.logger.log(`GitHub issues response: ${issues.length} issues found`);
                        if (issues.length > 0) {
                            githubData.assigned_issues = issues.map((i: any) => ({
                                title: i.title,
                                number: i.number,
                                repo: i.repository?.full_name || 'unknown',
                                url: i.html_url,
                                state: i.state,
                                created_at: i.created_at
                            }));
                        }
                    } else {
                        const errText = await issuesRes.text();
                        this.logger.error(`GitHub Issues API Error: ${issuesRes.status} ${errText}`);
                    }

                    if (eventsRes.ok) {
                        const events = await eventsRes.json();
                        this.logger.log(`GitHub events response: ${events.length} events found`);
                        if (events && events.length > 0) {
                            // Filter for push events
                            const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
                            if (pushEvents.length > 0) {
                                githubData.recent_pushes = pushEvents.slice(0, 5).map((e: any) => ({
                                    repo: e.repo.name,
                                    commits: e.payload.commits?.length || 0,
                                    time: e.created_at,
                                    branch: e.payload.ref
                                }));
                            }
                        }
                    } else {
                        const errText = await eventsRes.text();
                        this.logger.error(`GitHub Events API Error: ${eventsRes.status} ${errText}`);
                    }

                    if (prsRes.ok) {
                        const prsData = await prsRes.json();
                        if (prsData.items && prsData.items.length > 0) {
                            githubData.open_prs = prsData.items.map((pr: any) => ({
                                title: pr.title,
                                number: pr.number,
                                repo: pr.repository_url?.split('/').slice(-2).join('/') || 'unknown',
                                url: pr.html_url,
                                created_at: pr.created_at
                            }));
                            this.logger.log(`Found ${prsData.items.length} open PRs`);
                        }
                    } else {
                        const errText = await prsRes.text();
                        this.logger.error(`GitHub PR Search API Error: ${prsRes.status} ${errText}`);
                    }

                    if (reposRes.ok) {
                        const repos = await reposRes.json();
                        if (repos && repos.length > 0) {
                            githubData.repositories = repos.map((r: any) => ({
                                name: r.name,
                                full_name: r.full_name,
                                private: r.private,
                                html_url: r.html_url,
                                description: r.description,
                                updated_at: r.updated_at
                            }));
                            this.logger.log(`Found ${repos.length} user repositories`);
                        }
                    } else {
                        const errText = await reposRes.text();
                        this.logger.error(`GitHub Repos API Error: ${reposRes.status} ${errText}`);
                    }

                    // Always populate integration data if we successfully connected (even if empty)
                    integrationData.github = githubData;
                    connectedIntegrationsStr.push('GitHub');
                    this.logger.log(`GitHub data fetched (Repos: ${githubData.repositories.length}, Issues: ${githubData.assigned_issues.length}, Pushes: ${githubData.recent_pushes.length}, PRs: ${githubData.open_prs.length})`);
                } else {
                    this.logger.warn('GitHub token not found or missing access_token');
                }
            } catch (e) {
                this.logger.error(`Exception fetching github for user ${userId}`, e);
                // Still mark as connected if we have the provider
                connectedIntegrationsStr.push('GitHub');
            }
        }

        // --- Gmail ---
        if ((topic === 'email' || topic === 'general') && connectedProviders.includes('gmail')) {
            try {
                this.logger.log('Fetching Gmail data...');
                const token = await this.integrationsService.getDecryptedToken(userId, 'gmail');
                if (token && token.access_token) {
                    // Fetch recent unread emails
                    const messagesRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=5', {
                        headers: { Authorization: `Bearer ${token.access_token}` }
                    });

                    if (messagesRes.ok) {
                        const data = await messagesRes.json();
                        if (data.messages && data.messages.length > 0) {
                            // Fetch full message details
                            const emailDetails = await Promise.all(
                                data.messages.slice(0, 5).map(async (msg: any) => {
                                    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                                        headers: { Authorization: `Bearer ${token.access_token}` }
                                    });
                                    if (detailRes.ok) {
                                        const detail = await detailRes.json();
                                        const headers = detail.payload.headers;
                                        return {
                                            id: detail.id,
                                            subject: headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
                                            from: headers.find((h: any) => h.name === 'From')?.value || 'Unknown',
                                            date: headers.find((h: any) => h.name === 'Date')?.value,
                                            snippet: detail.snippet
                                        };
                                    }
                                    return null;
                                })
                            );

                            const validEmails = emailDetails.filter(Boolean);
                            if (validEmails.length > 0) {
                                integrationData.gmail = { unread_emails: validEmails };
                                connectedIntegrationsStr.push('Gmail');
                                this.logger.log(`Found ${validEmails.length} unread emails`);
                            }
                        }
                    } else {
                        const errText = await messagesRes.text();
                        this.logger.error(`Gmail API Error: ${messagesRes.status} ${errText}`);
                    }
                }
            } catch (e) {
                this.logger.error(`Exception fetching gmail for user ${userId}`, e);
            }
        }

        // --- Fathom ---
        if ((topic === 'transcript' || topic === 'general') && connectedProviders.includes('fathom')) {
            try {
                this.logger.log('Fetching Fathom data...');
                const token = await this.integrationsService.getDecryptedToken(userId, 'fathom');
                if (token && token.access_token) {
                    // Fetch recent calls/transcripts
                    const callsRes = await fetch('https://api.fathom.video/v1/calls?limit=5', {
                        headers: {
                            Authorization: `Bearer ${token.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (callsRes.ok) {
                        const calls = await callsRes.json();
                        if (calls && calls.length > 0) {
                            integrationData.fathom = {
                                recent_calls: calls.map((call: any) => ({
                                    id: call.id,
                                    title: call.title,
                                    start_time: call.start_time,
                                    duration: call.duration,
                                    summary: call.summary,
                                    action_items: call.action_items
                                }))
                            };
                            connectedIntegrationsStr.push('Fathom');
                            this.logger.log(`Found ${calls.length} Fathom recordings`);
                        }
                    } else {
                        const errText = await callsRes.text();
                        this.logger.error(`Fathom API Error: ${callsRes.status} ${errText}`);
                    }
                }
            } catch (e) {
                this.logger.error(`Exception fetching fathom for user ${userId}`, e);
            }
        }

        // --- Stakeholders ---
        if (topic === 'stakeholder' || topic === 'general') {
            try {
                this.logger.log('Fetching Stakeholder data...');
                const stakeholders = await this.prisma.stakeholder.findMany({
                    where: { userId },
                    orderBy: { nextReachOutAt: 'asc' },
                    take: 10
                });

                if (stakeholders.length > 0) {
                    integrationData.stakeholders = stakeholders.map(s => ({
                        name: s.name,
                        role: s.role,
                        organization: s.organization,
                        email: s.email,
                        next_reach_out: s.nextReachOutAt,
                        last_contacted: s.lastContactedAt,
                        notes: s.notes
                    }));
                    this.logger.log(`Found ${stakeholders.length} stakeholders`);
                }
            } catch (e) {
                this.logger.error(`Exception fetching stakeholders for user ${userId}`, e);
            }
        }

        // --- DASHBOARD DATA (Core Intelligence) ---
        // Fetch if topic is dashboard-related OR general, as this provides crucial context like "Blockers"
        if (topic === 'dashboard' || topic === 'general' || topic === 'tasks' || topic === 'blockers' || topic === 'risks') {
            try {
                this.logger.log('Fetching Dashboard data...');
                const dbData = await this.dashboardService.getDashboardData(userId);

                // Simplify for LLM (reduce token usage)
                integrationData.dashboard = {
                    blockers: dbData.tasks.filter(t => t.isBlocked),
                    risks: dbData.updates,
                    active_tasks_count: dbData.tasks.length,
                    recent_tasks: dbData.tasks.slice(0, 5), // Only show top 5 active tasks to save tokens
                    upcoming_meetings: dbData.meetings.slice(0, 3),
                    team_members: dbData.people.map(p => p.displayName),
                    github_intelligence: dbData.githubIntelligence // This is the high-level summary
                };
                this.logger.log('Dashboard data attached to context');
            } catch (e) {
                this.logger.error(`Exception fetching dashboard data for user ${userId}`, e);
            }
        }

        return {
            userContext: {
                timezone: 'America/New_York',
                connected_integrations: connectedIntegrationsStr,
                topic_detected: topic
            },
            integrationData
        };
    }

    private detectTopic(query: string): string {
        const q = query.toLowerCase();
        if (q.includes('meeting') || q.includes('calendar') || q.includes('schedule') || q.includes('appointment')) return 'calendar';
        if (q.includes('slack') || q.includes('message') || q.includes('chat') || q.includes('dm') || q.includes('channel')) return 'slack';
        if (q.includes('github') || q.includes('pr') || q.includes('issue') || q.includes('code') || q.includes('repo') || q.includes('commit')) return 'github';
        if (q.includes('email') || q.includes('gmail') || q.includes('inbox') || q.includes('unread')) return 'email';
        if (q.includes('transcript') || q.includes('recording') || q.includes('fathom') || q.includes('call summary')) return 'transcript';
        if (q.includes('stakeholder') || q.includes('client') || q.includes('contact') || q.includes('partner')) return 'stakeholder';

        // Dashboard specific keywords
        if (q.includes('dashboard') || q.includes('blocker') || q.includes('risk') || q.includes('attention') || q.includes('task') || q.includes('overview') || q.includes('stats') || q.includes('progress')) return 'dashboard';

        return 'general';
    }
}
