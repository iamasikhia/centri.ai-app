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

        const params = {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            // redirect_uri: redirectUri, // Omitted to let GitHub use the default configured one
            state: 'random_state_string'
        };
        console.log('[Github] Exchanging code. URI:', redirectUri, 'ClientID:', clientId);

        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            params,
            {
                headers: { Accept: 'application/json' },
            }
        );

        if (response.data.error) {
            console.error('[Github] Exchange Error:', response.data);
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

    async fetchActivity(token: string): Promise<any> {
        try {
            const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' };

            // 1. Get recent repos (limit 5)
            const reposRes = await axios.get('https://api.github.com/user/repos', {
                headers,
                params: { sort: 'pushed', direction: 'desc', per_page: 5 }
            });

            const repos = reposRes.data;
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            const activity = {
                commits: [],
                prs: [],
                releases: []
            };

            await Promise.all(repos.map(async (repo: any) => {
                // Commits
                try {
                    const commitsRes = await axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
                        headers, params: { since: twoWeeksAgo.toISOString(), per_page: 20 }
                    });
                    activity.commits.push(...commitsRes.data.map((c: any) => ({
                        repo: repo.name,
                        message: c.commit.message,
                        author: c.commit.author.name,
                        date: c.commit.author.date,
                        url: c.html_url
                    })));
                } catch (e) { }

                // PRs
                try {
                    const prsRes = await axios.get(`https://api.github.com/repos/${repo.full_name}/pulls`, {
                        headers, params: { state: 'all', sort: 'updated', direction: 'desc', per_page: 10 }
                    });
                    activity.prs.push(...prsRes.data.map((pr: any) => ({
                        repo: repo.name,
                        title: pr.title,
                        state: pr.state,
                        merged: !!pr.merged_at,
                        created_at: pr.created_at,
                        merged_at: pr.merged_at,
                        closed_at: pr.closed_at,
                        user: pr.user.login,
                        url: pr.html_url
                    })));
                } catch (e) { }

                // Releases
                try {
                    const relRes = await axios.get(`https://api.github.com/repos/${repo.full_name}/releases`, {
                        headers, params: { per_page: 3 }
                    });
                    activity.releases.push(...relRes.data.map((r: any) => ({
                        repo: repo.name,
                        name: r.name,
                        tag: r.tag_name,
                        published_at: r.published_at,
                        url: r.html_url
                    })));
                } catch (e) { }
            }));

            return activity;

        } catch (e) {
            console.error('[Github] Fetch Activity Error', e.message);
            return { commits: [], prs: [], releases: [] };
        }
    }
}
