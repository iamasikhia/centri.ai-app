import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class GmailProvider implements IProvider {
    name = 'gmail';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        // Using Gmail readonly scope
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' ');

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        return response.data;
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        const emails = [];
        try {
            // Fetch latest 10 messages from Inbox
            const listRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=10', {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            });

            const messages = listRes.data.messages || [];

            for (const msg of messages) {
                try {
                    const detailRes = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                        headers: { Authorization: `Bearer ${tokens.access_token}` }
                    });
                    const data = detailRes.data;

                    const headers = data.payload.headers;
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
                    const date = headers.find((h: any) => h.name === 'Date')?.value;

                    emails.push({
                        externalId: data.id,
                        title: subject,
                        from: from,
                        receivedAt: date ? new Date(date) : new Date(),
                        snippet: data.snippet,
                        link: `https://mail.google.com/mail/u/0/#inbox/${data.id}`
                    });
                } catch (e) {
                    console.warn(`Failed to fetch email details for ${msg.id}`, e.message);
                }
            }

        } catch (e) {
            console.error('Gmail Sync Error', e.response?.data || e.message);
        }

        return {
            emails: emails
        };
    }
}
