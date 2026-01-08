import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class GoogleChatProvider implements IProvider {
    name = 'google_chat';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const scopes = [
            'https://www.googleapis.com/auth/chat.spaces.readonly',
            'https://www.googleapis.com/auth/chat.messages.readonly',
            'https://www.googleapis.com/auth/chat.memberships.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' ');

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

        try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            });
            return response.data;
        } catch (error) {
            console.error('[GoogleChatProvider] Token Exchange Failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        const headers = { Authorization: `Bearer ${tokens.access_token}` };
        const result: SyncResult = { teamMembers: [], customData: {} };

        try {
            // Fetch Spaces
            const spacesRes = await axios.get('https://chat.googleapis.com/v1/spaces', { headers });
            const spaces = spacesRes.data.spaces || [];

            // For each space, maybe fetch members?
            // Note: Google Chat API quotas can be strict.

            const membersMap = new Map<string, any>();

            for (const space of spaces.slice(0, 5)) { // Limit to 5 spaces for MVP sync speed
                try {
                    // Memberships
                    const membersRes = await axios.get(`https://chat.googleapis.com/v1/${space.name}/members`, { headers });
                    (membersRes.data.memberships || []).forEach((m: any) => {
                        if (m.member.type === 'HUMAN' && m.member.email) {
                            membersMap.set(m.member.name, {
                                externalId: m.member.name, // resource name like users/123
                                name: m.member.displayName,
                                email: m.member.email,
                                avatarUrl: m.member.avatarUrl,
                                source: 'google_chat'
                            });
                        }
                    });
                } catch (e) {
                    console.warn(`[GoogleChatProvider] Failed to fetch members for space ${space.name}`, e.message);
                }
            }

            result.teamMembers = Array.from(membersMap.values());
            result.customData.totalSpaces = spaces.length;

        } catch (e) {
            console.error('[GoogleChatProvider] Sync Error', e.response?.data || e.message);
        }

        return result;
    }
}
