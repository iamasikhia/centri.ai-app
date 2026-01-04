import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class GithubProvider implements IProvider {
    name = 'github';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        // Scopes: repo (to read code/commits), user:email (for discovery)
        const scopes = 'repo user:email';
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('GITHUB_CLIENT_ID');
        const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');

        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            },
            {
                headers: { Accept: 'application/json' },
            }
        );

        if (response.data.error) {
            throw new Error(response.data.error_description || response.data.error);
        }

        return response.data;
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        const tasks = [];
        const teamMembers = [];

        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
                Accept: 'application/vnd.github.v3+json'
            };

            // 1. Fetch User (Discovery)
            const userRes = await axios.get('https://api.github.com/user', { headers });
            teamMembers.push({
                externalId: String(userRes.data.id),
                name: userRes.data.name || userRes.data.login,
                email: userRes.data.email, // Might be null if private
                avatarUrl: userRes.data.avatar_url,
                sourcesJson: JSON.stringify(['github'])
            });

            // 2. Fetch Notifications / Activity (Updates to main/product)
            // For MVP: Fetch recently updated Pull Requests from user's repos
            // "Managers can get notifications when new update has been made to main or product"
            // -> We'll look for closed PRs merged to 'main' or 'product' recently.

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const dateStr = oneWeekAgo.toISOString().split('T')[0];

            // Search query: is:pr is:merged merged:>202X-XX-XX base:main
            // This is a global search (can be rate limited). Better to list events or user repos.
            // For MVP scalability: Search issues API scoped to user involves less iteration than listing all repos.

            const q = `is:pr is:merged merged:>${dateStr} author:${userRes.data.login} archived:false`;
            const searchRes = await axios.get(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}`, { headers });

            if (searchRes.data.items) {
                tasks.push(...searchRes.data.items.map((pr: any) => ({
                    externalId: String(pr.id),
                    title: `[Merged] ${pr.title}`,
                    status: 'Done',
                    assigneeEmail: null, // GitHub doesn't easily expose emails in search
                    dueDate: pr.closed_at, // Use closed time as "due/done" time
                    priority: 'High',
                    isBlocked: false,
                    rawJson: JSON.stringify(pr)
                })));
            }

        } catch (e) {
            console.error('GitHub Sync Error', e.message);
        }

        return {
            tasks,
            teamMembers
        };
    }
}
