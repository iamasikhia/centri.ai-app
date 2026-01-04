import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class ClickUpProvider implements IProvider {
    name = 'clickup';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('CLICKUP_CLIENT_ID');
        // ClickUp uses 'redirect_uri' 
        return `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('CLICKUP_CLIENT_ID');
        const clientSecret = this.config.get('CLICKUP_CLIENT_SECRET');

        const response = await axios.post('https://api.clickup.com/api/v2/oauth/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
            },
        });

        return response.data; // struct: { access_token: '...', type: 'bearer' }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            // 1. Get User Info
            const userRes = await axios.get('https://api.clickup.com/api/v2/user', {
                headers: { Authorization: tokens.access_token },
            });
            const user = userRes.data.user;

            // 2. Get Teams (Workspaces) - To find tasks, we need a team ID
            const teamsRes = await axios.get('https://api.clickup.com/api/v2/team', {
                headers: { Authorization: tokens.access_token },
            });
            const teams = teamsRes.data.teams || [];

            // 3. (Optional) Fetch tasks from first team for now
            let tasks = [];
            if (teams.length > 0) {
                // Fetch tasks assigned to me?
                // GET https://api.clickup.com/api/v2/team/{team_id}/task?assignees[]={user_id}
                // Note: this might be slow, for MVP just fetch user/team info
                /*
                const teamId = teams[0].id;
                const tasksRes = await axios.get(`https://api.clickup.com/api/v2/team/${teamId}/task`, {
                    headers: { Authorization: tokens.access_token },
                    params: { assignees: [user.id] }
                });
                tasks = tasksRes.data.tasks;
                */
            }

            return {
                teamMembers: [{
                    externalId: String(user.id),
                    name: user.username,
                    email: user.email,
                    avatarUrl: user.profilePicture,
                    sourcesJson: JSON.stringify(['clickup'])
                }],
                customData: {
                    teams: teams
                }
            };
        } catch (e) {
            console.error('ClickUp Sync Error', e.message);
            return {}; // Return empty on error to avoid breaking the sync
        }
    }
}
