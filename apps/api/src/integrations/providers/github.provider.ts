import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IProvider } from './provider.interface';

@Injectable()
export class GithubProvider implements IProvider {
    name = 'github';

    getAuthUrl(redirectUri: string): string {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const scopes = 'repo,user,read:org';
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        const params = {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            state: 'random_state_string'
        };
        console.log('[Github] Exchanging code. URI:', redirectUri, 'ClientID:', clientId);

        const res = await axios.post('https://github.com/login/oauth/access_token', params, {
            headers: { Accept: 'application/json' }
        });

        console.log('[Github] Token exchange response:', res.data);
        return res.data;
    }

    async syncData(token: any): Promise<any> {
        // Validate token
        if (!token || !token.access_token) {
            throw new Error('GitHub token is missing or invalid');
        }

        const headers = { Authorization: `Bearer ${token.access_token}` };

        // Fetch user info - this also validates the token
        let userRes;
        try {
            userRes = await axios.get('https://api.github.com/user', { headers });
        } catch (authError: any) {
            if (authError.response?.status === 401) {
                console.error('[Github] Token is invalid or expired during sync');
                throw new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
            }
            throw authError;
        }
        const user = userRes.data;

        // Fetch repositories
        const reposRes = await axios.get('https://api.github.com/user/repos', {
            headers,
            params: { per_page: 10, sort: 'updated' }
        });
        const repos = reposRes.data;

        // Map to team members (contributors)
        const teamMembers = repos.flatMap((repo: any) => {
            return [{
                name: user.name || user.login,
                email: user.email || `${user.login}@github.com`,
                avatarUrl: user.avatar_url,
                sources: ['github']
            }];
        });

        // Map to tasks (open issues assigned to user)
        const issuesRes = await axios.get('https://api.github.com/search/issues', {
            headers,
            params: { q: 'is:issue is:open assignee:@me', per_page: 20 }
        });

        const tasks = (issuesRes.data.items || []).map((issue: any) => ({
            externalId: `github-${issue.id}`,
            title: issue.title,
            status: issue.state === 'open' ? 'Todo' : 'Done',
            assigneeEmail: user.email || `${user.login}@github.com`,
            dueDate: null,
            priority: issue.labels.some((l: any) => l.name.includes('urgent')) ? 'High' : 'Medium',
            isBlocked: issue.labels.some((l: any) => l.name.includes('blocked')),
            source: 'github',
            sourceUrl: issue.html_url,
            description: issue.body
        }));

        return {
            repos,
            tasks,
            teamMembers
        };
    }

    async fetchActivity(token: string): Promise<any> {
        try {
            // Validate token before making requests
            if (!token) {
                throw new Error('GitHub token is missing or invalid');
            }

            const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' };
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const dateStr = sevenDaysAgo.toISOString().split('T')[0];

            // 0. Get User Identity - this also validates the token
            let userRes;
            try {
                userRes = await axios.get('https://api.github.com/user', { headers });
            } catch (authError: any) {
                if (authError.response?.status === 401) {
                    console.error('[Github] Token is invalid or expired');
                    throw new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
                }
                throw authError;
            }
            const username = userRes.data.login;

            console.log(`[Github] Fetching activity for user: ${username}`);

            // 1. Get all repositories the user has access to (owned + member of)
            const reposRes = await axios.get('https://api.github.com/user/repos', {
                headers,
                params: {
                    affiliation: 'owner,collaborator,organization_member',
                    sort: 'updated',
                    per_page: 50
                }
            });
            const repos = reposRes.data || [];
            console.log(`[Github] Found ${repos.length} repositories`);

            let allCommits: any[] = [];
            let allPRs: any[] = [];
            let allReleases: any[] = [];

            // 2. For each repo, fetch recent activity
            for (const repo of repos.slice(0, 5)) { // Limit to 5 most recent repos to avoid rate limits
                const repoFullName = repo.full_name;
                console.log(`[Github] Fetching activity for repo: ${repoFullName}`);

                try {
                    // Fetch commits
                    const commitsRes = await axios.get(`https://api.github.com/repos/${repoFullName}/commits`, {
                        headers,
                        params: { since: dateStr, per_page: 20 }
                    });
                    const commits = (commitsRes.data || []).map((c: any) => ({
                        sha: c.sha,
                        message: c.commit.message,
                        date: c.commit.author.date,
                        author: c.author?.login || c.commit.author.name,
                        url: c.html_url,
                        repo: repoFullName
                    }));
                    allCommits.push(...commits);

                    // Fetch PRs
                    const prsRes = await axios.get(`https://api.github.com/repos/${repoFullName}/pulls`, {
                        headers,
                        params: { state: 'all', sort: 'updated', direction: 'desc', per_page: 10 }
                    });
                    const prs = (prsRes.data || [])
                        .filter((pr: any) => new Date(pr.updated_at) >= sevenDaysAgo)
                        .map((pr: any) => ({
                            number: pr.number,
                            title: pr.title,
                            state: pr.state,
                            created_at: pr.created_at,
                            updated_at: pr.updated_at,
                            closed_at: pr.closed_at,
                            merged_at: pr.merged_at,
                            merged: !!pr.merged_at,
                            author: pr.user.login,
                            url: pr.html_url,
                            repo: repoFullName,
                            additions: pr.additions || 0,
                            deletions: pr.deletions || 0,
                            changed_files: pr.changed_files || 0,
                            requested_reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
                            merged_by: pr.merged_by?.login || null
                        }));
                    allPRs.push(...prs);

                    // Fetch releases
                    const releasesRes = await axios.get(`https://api.github.com/repos/${repoFullName}/releases`, {
                        headers,
                        params: { per_page: 5 }
                    });
                    const releases = (releasesRes.data || [])
                        .filter((r: any) => new Date(r.published_at) >= sevenDaysAgo)
                        .map((r: any) => ({
                            id: r.id,
                            name: r.name,
                            tag_name: r.tag_name,
                            published_at: r.published_at,
                            author: r.author?.login,
                            url: r.html_url,
                            repo: repoFullName,
                            prerelease: r.prerelease
                        }));
                    allReleases.push(...releases);

                } catch (repoError) {
                    console.error(`[Github] Error fetching data for ${repoFullName}:`, repoError.message);
                    // Continue with other repos
                }
            }

            console.log(`[Github] Total activity: ${allCommits.length} commits, ${allPRs.length} PRs, ${allReleases.length} releases`);

            return {
                commits: allCommits,
                releases: allReleases,
                prs: allPRs,
                issues: [], // Not fetching issues for now to reduce API calls
                reviews: [],
                repositories: repos.map((r: any) => ({
                    fullName: r.full_name,
                    name: r.name,
                    description: r.description,
                    language: r.language,
                    stars: r.stargazers_count,
                    forks: r.forks_count,
                    isPrivate: r.private,
                    updatedAt: r.updated_at,
                    defaultBranch: r.default_branch,
                    url: r.html_url,
                    owner: r.owner?.login
                }))
            };

        } catch (e) {
            const fs = require('fs');
            fs.appendFileSync('github-debug.log', `[${new Date().toISOString()}] Fetch Activity Error: ${e.message}\n`);
            if (e.response) {
                fs.appendFileSync('github-debug.log', `[${new Date().toISOString()}] Response Data: ${JSON.stringify(e.response.data)}\n`);
            }
            console.error('[Github] Fetch Activity Error', e.message);
            return { commits: [], releases: [], prs: [], issues: [], reviews: [] };
        }
    }
}
