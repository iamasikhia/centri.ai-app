import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IProvider } from './provider.interface';
import axios from 'axios';
import { URLSearchParams } from 'url';

@Injectable()
export class TeamsProvider implements IProvider {
    name = 'microsoft_teams';
    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('TEAMS_CLIENT_ID');
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            response_mode: 'query',
            scope: 'User.Read Team.ReadBasic.All Channel.ReadBasic.All Chat.Read offline_access',
            state: 'teams_auth_state',
        });
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('TEAMS_CLIENT_ID');
        const clientSecret = this.config.get('TEAMS_CLIENT_SECRET');

        const params = new URLSearchParams({
            client_id: clientId,
            scope: 'User.Read Team.ReadBasic.All Channel.ReadBasic.All Chat.Read offline_access',
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            client_secret: clientSecret,
        });

        try {
            const response = await axios.post(
                'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Teams token exchange error:', error.response?.data || error.message);
            throw new Error('Failed to exchange Teams code');
        }
    }

    async syncData(userId: string, token: string): Promise<any> {
        // Basic sync implementation: Fetch joined teams
        try {
            const response = await axios.get('https://graph.microsoft.com/v1.0/me/joinedTeams', {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            console.error('Teams sync error:', error.response?.data || error.message);
            return [];
        }
    }
}
