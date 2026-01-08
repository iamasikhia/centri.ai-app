import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class NotionProvider implements IProvider {
    name = 'notion';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('NOTION_CLIENT_ID');
        const state = Math.random().toString(36).substring(7);

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            owner: 'user',
            state: state,
        });

        return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('NOTION_CLIENT_ID');
        const clientSecret = this.config.get('NOTION_CLIENT_SECRET');

        const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await axios.post('https://api.notion.com/v1/oauth/token',
                {
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                },
                {
                    headers: {
                        'Authorization': `Basic ${encoded}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Notion token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange Notion code');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        // Basic sync implementation - fetching workspace users as a starting point
        try {
            const response = await axios.get('https://api.notion.com/v1/users', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'Notion-Version': '2022-06-28'
                }
            });

            return {
                teamMembers: response.data.results.map((u: any) => ({
                    externalId: u.id,
                    name: u.name,
                    email: u.person?.email,
                    avatarUrl: u.avatar_url,
                    source: 'notion'
                })),
                customData: {
                    workspace_name: tokens.workspace_name,
                    workspace_id: tokens.workspace_id
                }
            };
        } catch (error) {
            console.warn('Notion sync failed (likely insufficient permissions for users), returning basic info');
            return {
                customData: {
                    workspace_name: tokens.workspace_name,
                    workspace_id: tokens.workspace_id
                }
            };
        }
    }
}
