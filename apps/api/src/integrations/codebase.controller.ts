import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { GithubDocsService } from './github-docs.service';
import { CodebaseExplainerService } from './codebase-explainer.service';
import { CodebaseAnalyzerService } from './codebase-analyzer.service';
import { IntegrationsService } from './integrations.service';

import { PrismaService } from '../prisma/prisma.service';
import { GoogleDocsProvider } from './providers/google-docs.provider';
import { formatProductReport } from './utils/report-formatter';

@Controller('codebase')
export class CodebaseController {
    constructor(
        private readonly githubDocsService: GithubDocsService,
        private readonly explainerService: CodebaseExplainerService,
        private readonly analyzerService: CodebaseAnalyzerService,
        private readonly integrationsService: IntegrationsService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('repositories')
    async listRepositories(@Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';

        try {
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { repositories: [], error: 'GitHub not connected' };
            }

            const repositories = await this.githubDocsService.listUserRepositories(token.access_token);
            return { repositories };
        } catch (error) {
            console.error('[Codebase] Failed to list repositories', error.message);
            return { repositories: [], error: 'Failed to fetch repositories' };
        }
    }

    @Get('analyze')
    async analyzeRepository(@Query('repository') repository: string, @Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';

        if (!repository) {
            return { error: 'Repository is required' };
        }

        try {
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { error: 'GitHub not connected' };
            }

            const [owner, repo] = repository.split('/');
            if (!owner || !repo) {
                return { error: 'Invalid repository format. Expected: owner/repo' };
            }

            // Analyze repository structure
            const analysis = await this.analyzerService.analyzeRepository(
                token.access_token,
                owner,
                repo
            );

            return { analysis };
        } catch (error) {
            console.error('[Codebase] Analysis failed', error.message);
            return { error: 'Failed to analyze repository', details: error.message };
        }
    }

    @Post('explain')
    async explainCodebase(@Body() body: { repository: string }, @Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const { repository } = body;

        if (!repository) {
            return { error: 'Repository is required' };
        }

        try {
            // Get GitHub token
            const token = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!token || !token.access_token) {
                return { error: 'GitHub not connected' };
            }

            // Parse owner/repo
            const [owner, repo] = repository.split('/');
            if (!owner || !repo) {
                return { error: 'Invalid repository format. Expected: owner/repo' };
            }

            // Fetch documentation
            const documentation = await this.githubDocsService.fetchRepositoryDocumentation(
                token.access_token,
                owner,
                repo
            );

            if (!documentation.combinedContent || documentation.combinedContent.trim().length === 0) {
                return {
                    error: 'No documentation found',
                    message: 'This repository does not have a README or documentation files.',
                };
            }

            // Generate AI explanation
            const explanation = await this.explainerService.explainCodebase(
                documentation.combinedContent,
                repository
            );

            return {
                repository,
                explanation,
                filesAnalyzed: documentation.files.filter(f => f.found).map(f => f.path),
            };
        } catch (error) {
            console.error('[Codebase] Explanation failed', error.message);
            return { error: 'Failed to generate explanation', details: error.message };
        }
    }

    @Post('report')
    async generateReport(@Body() body: { repository: string, includeProductData?: boolean, includeCodebaseData?: boolean, reportType?: 'product' | 'tasks', action?: 'preview' | 'export', content?: string }, @Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const { repository, includeProductData, includeCodebaseData = true, reportType = 'product', action = 'export', content } = body;

        if (!repository) return { error: 'Repository is required' };

        try {
            // HANDLE EXPORT WITH EXISTING CONTENT (User edited)
            if (action === 'export' && content) {
                let docsToken = await this.integrationsService.getDecryptedToken(userId, 'google_docs');
                if (!docsToken) return { error: 'Google Docs not connected', details: 'Please connect Google Docs in settings.' };

                const docsProvider = this.integrationsService.getProvider('google_docs') as GoogleDocsProvider;
                const docUrl = await docsProvider.createDocument(docsToken, `Product Report: ${repository.split('/')[1]} - ${new Date().toISOString().split('T')[0]}`, content);
                return { url: docUrl };
            }

            // OTHERWISE: GENERATE CONTENT
            // 1. Get GitHub Token & Codebase Data
            const ghToken = await this.integrationsService.getDecryptedToken(userId, 'github');
            if (!ghToken || !ghToken.access_token) return { error: 'GitHub not connected' };

            const [owner, repo] = repository.split('/');
            const documentation = await this.githubDocsService.fetchRepositoryDocumentation(ghToken.access_token, owner, repo);

            let explanation = null;
            if (documentation.combinedContent) {
                explanation = await this.explainerService.explainCodebase(documentation.combinedContent, repository);
            }

            // 2. Fetch Product Data (if requested)
            let tasks = [], updates = [], meetings = [];

            if (includeProductData) {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const activityData = await this.integrationsService.getRecentActivity(userId);

                // Filter and Map GitHub Activity (Last 7 Days)
                const githubActivity = (activityData.github || [])
                    .filter((item: any) => new Date(item.date) >= oneWeekAgo)
                    .map((item: any) => ({
                        source: 'github',
                        type: item.title.includes('PR:') ? 'github_pr' : 'github_push', // Simple inference
                        title: item.title,
                        description: item.status ? `Status: ${item.status}` : '',
                        occurredAt: new Date(item.date),
                        url: item.link
                    }));

                // Combine with DB data if needed, or just use live data
                updates = githubActivity;

                const taskWhere: any = { userId };
                if (reportType === 'product') {
                    taskWhere.status = { not: 'completed' };
                }

                [tasks, meetings] = await Promise.all([
                    this.prisma.task.findMany({
                        where: taskWhere,
                        orderBy: { createdAt: 'desc' },
                        take: 20
                    }),
                    this.prisma.meeting.findMany({
                        where: { userId, createdAt: { gte: oneWeekAgo }, decisionsJson: { not: null } },
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    })
                ]);
            }

            // 3. Generate Professional Report
            const reportContent = formatProductReport({
                repo,
                explanation,
                tasks: includeProductData ? tasks : [],
                updates: includeProductData ? updates : [],
                meetings: includeProductData ? meetings : [],
                reportType
            });

            // RETURN PREVIEW
            if (action === 'preview') {
                return { content: reportContent };
            }

            // DIRECT EXPORT (Legacy/Default)
            let docsToken = await this.integrationsService.getDecryptedToken(userId, 'google_docs');
            if (!docsToken) return { error: 'Google Docs not connected', details: 'Please connect Google Docs in settings.' };

            const docsProvider = this.integrationsService.getProvider('google_docs') as GoogleDocsProvider;
            const docUrl = await docsProvider.createDocument(docsToken, `Product Report: ${repo} - ${new Date().toISOString().split('T')[0]}`, reportContent);

            return { url: docUrl, preview: reportContent.substring(0, 500) + '...' };

        } catch (error) {
            console.error('[Codebase] Report generation failed', error);
            return { error: 'Report generation failed', details: error.message };
        }
    }

    @Post('ask')
    async askQuestion(
        @Body() body: {
            repository: string;
            question: string;
            context?: string;
            conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
            analysisData?: any;
        },
        @Req() req
    ) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const { repository, question, context, conversationHistory = [], analysisData } = body;

        if (!question?.trim()) {
            return { error: 'Question is required' };
        }

        try {
            // Get GitHub token to fetch real-time data if needed
            let repoContext = '';
            try {
                const token = await this.integrationsService.getDecryptedToken(userId, 'github');
                if (token?.access_token && repository) {
                    const [owner, repo] = repository.split('/');

                    // Fetch recent commits for context
                    const { Octokit } = require('@octokit/rest');
                    const octokit = new Octokit({ auth: token.access_token });

                    try {
                        const { data: commits } = await octokit.repos.listCommits({
                            owner,
                            repo,
                            per_page: 10
                        });

                        const recentWork = commits.map((c: any) =>
                            `- ${c.commit.message.split('\n')[0]} (${c.commit.author?.name}, ${new Date(c.commit.author?.date).toLocaleDateString()})`
                        ).join('\n');

                        repoContext += `\n\n## Recent Development Activity (Last 10 commits):\n${recentWork}`;
                    } catch (e) {
                        // Ignore errors fetching commits
                    }
                }
            } catch (e) {
                // Continue without live data
            }

            // Build comprehensive system prompt
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            let analysisContext = '';
            if (analysisData) {
                // Include file structure summary
                if (analysisData.fileTree) {
                    const dirs = analysisData.fileTree.filter((f: any) => f.type === 'tree').slice(0, 20);
                    const files = analysisData.fileTree.filter((f: any) => f.type === 'blob').slice(0, 30);
                    analysisContext += `\n\n## Project Structure:\nMain folders: ${dirs.map((d: any) => d.path).join(', ')}\nKey files: ${files.map((f: any) => f.path).join(', ')}`;
                }

                // Include dependencies
                if (analysisData.dependencies && analysisData.dependencies.length > 0) {
                    const deps = analysisData.dependencies.slice(0, 15);
                    analysisContext += `\n\n## Key Dependencies:\n${deps.map((d: any) => `- ${d.name}@${d.version} (${d.type})`).join('\n')}`;
                }

                // Include languages
                if (analysisData.languages) {
                    const total = Object.values(analysisData.languages).reduce((a: any, b: any) => a + b, 0) as number;
                    const langBreakdown = Object.entries(analysisData.languages)
                        .map(([lang, bytes]) => `${lang}: ${((bytes as number / total) * 100).toFixed(1)}%`)
                        .join(', ');
                    analysisContext += `\n\n## Languages Used: ${langBreakdown}`;
                }
            }

            // --- FETCH MEETING CONTEXT ---
            let meetingContext = '';
            try {
                const recentMeetings = await this.prisma.meeting.findMany({
                    where: {
                        userId,
                        startTime: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Last 2 weeks
                        summary: { not: null }
                    },
                    orderBy: { startTime: 'desc' },
                    take: 5,
                    select: { title: true, startTime: true, summary: true, decisionsJson: true }
                });

                if (recentMeetings.length > 0) {
                    meetingContext = `\n\n## Recent Meeting Context (What the team discussed):\n`;
                    recentMeetings.forEach(m => {
                        meetingContext += `\n### ${m.title} (${m.startTime.toISOString().split('T')[0]})\n`;
                        meetingContext += `Summary: ${m.summary}\n`;
                        if (m.decisionsJson) {
                            try {
                                const decisions = JSON.parse(m.decisionsJson);
                                if (decisions.length > 0) meetingContext += `Decisions: ${decisions.join(', ')}\n`;
                            } catch (e) { }
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to fetch meeting context for chat", e);
            }

            const systemPrompt = `You are Centri, an AI assistant specifically designed for non-technical Product Managers who need to understand their engineering team's codebase.

## Your Personality:
- Friendly, patient, and encouraging
- Never condescending about lack of technical knowledge
- Use simple analogies (like "think of it like a restaurant kitchen" for backend)
- Celebrate curiosity and good questions

## Your Capabilities:
- Explain what the codebase does in business terms
- Describe features and their purposes
- Identify what engineers are currently working on
- Flag potential risks in non-technical language
- Help prepare for technical discussions with the team
- **Cross-reference code activity with meeting discussions** (e.g. "You discussed X in the meeting, and I see code for X here")

## Your Limitations (BE HONEST ABOUT THESE):
- You are READ-ONLY and cannot modify any code
- You can only see what's in the repository, not the running application
- You don't know business metrics or user data
- Your knowledge is based on code structure, not actual usage

## Communication Style:
1. Start with a direct answer, then provide context
2. Use bullet points for clarity
3. Avoid jargon - if you must use a technical term, explain it in parentheses
4. If the user asks about a feature discussed in a meeting, explicitly check if there is code for it.
5. End with a related follow-up question the PM might want to ask
6. Keep responses focused and under 300 words unless asked for detail

## Repository Context:
**Repository:** ${repository}
${context ? `\n**PM-Friendly Summary:**\n${context}` : ''}
${analysisContext}
${repoContext}
${meetingContext}

Remember: The PM you're helping has important business decisions to make. Help them understand their product's technical side without overwhelming them.`;

            // Build messages with conversation history
            const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
                { role: 'system', content: systemPrompt }
            ];

            // Add conversation history (limit to last 10 exchanges for context window)
            const recentHistory = conversationHistory.slice(-20);
            for (const msg of recentHistory) {
                messages.push({ role: msg.role, content: msg.content });
            }

            // Add current question
            messages.push({ role: 'user', content: question });

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                temperature: 0.7,
                max_tokens: 1500
            });

            const answer = response.choices[0]?.message?.content ||
                "I'm sorry, I couldn't generate an answer. Please try again.";

            // Generate follow-up suggestions based on the question type
            let followUpSuggestions: string[] = [];
            const questionLower = question.toLowerCase();

            if (questionLower.includes('risk') || questionLower.includes('problem')) {
                followUpSuggestions = [
                    "How can we prioritize these risks?",
                    "Which risk affects users the most?",
                    "Should we discuss this with engineering?"
                ];
            } else if (questionLower.includes('feature') || questionLower.includes('work')) {
                followUpSuggestions = [
                    "When will this be ready?",
                    "Who is working on this?",
                    "Are there any blockers?"
                ];
            } else if (questionLower.includes('how') || questionLower.includes('what')) {
                followUpSuggestions = [
                    "Can you give me an example?",
                    "How does this affect our users?",
                    "What should I tell stakeholders?"
                ];
            } else {
                followUpSuggestions = [
                    "Tell me more about this",
                    "What are the risks here?",
                    "How is the team progressing?"
                ];
            }

            return {
                answer,
                followUpSuggestions,
                model: 'gpt-4o',
                tokensUsed: response.usage?.total_tokens || 0
            };
        } catch (error) {
            console.error('[Codebase] Ask question failed', error);
            return {
                error: 'Failed to process question',
                answer: "I'm having trouble processing your question right now. This might be because the AI service is temporarily unavailable. Please try again in a moment.",
                followUpSuggestions: ["Try asking again", "Rephrase your question"]
            };
        }
    }
}
