import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class GoogleDriveProvider implements IProvider {
    name = 'google_drive';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const scopes = [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' ');

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scopes,
            access_type: 'offline',
            prompt: 'consent',
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        try {
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
        } catch (error) {
            console.error('[GoogleDrive] Token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for token');
        }
    }

    async refreshTokens(refreshToken: string): Promise<any> {
        try {
            const clientId = this.config.get('GOOGLE_CLIENT_ID');
            const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

            const response = await axios.post('https://oauth2.googleapis.com/token', {
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
            });

            return response.data;
        } catch (error) {
            console.error('[GoogleDrive] Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh token');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get recent files (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const filesResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params: {
                    pageSize: 50,
                    orderBy: 'modifiedTime desc',
                    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,owners,shared,createdTime)',
                    q: `modifiedTime > '${thirtyDaysAgo.toISOString()}'`,
                },
            });

            const files = filesResponse.data.files || [];

            // Get user info
            const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers,
            });

            const userEmail = userInfoResponse.data.email;

            // Transform files into update items
            const updateItems = files.map((file: any) => {
                const isNew = new Date(file.createdTime) > thirtyDaysAgo;
                const action = isNew ? 'created' : 'modified';

                return {
                    title: `${file.name} ${action}`,
                    description: `File ${action} in Google Drive`,
                    link: file.webViewLink,
                    timestamp: new Date(file.modifiedTime),
                    metadata: {
                        fileId: file.id,
                        mimeType: file.mimeType,
                        iconLink: file.iconLink,
                        shared: file.shared,
                        owner: file.owners?.[0]?.displayName || userEmail,
                    },
                };
            });

            return {
                customData: {
                    files: updateItems,
                    totalFiles: files.length,
                    userEmail,
                },
            };
        } catch (error) {
            console.error('[GoogleDrive] Sync failed:', error.response?.data || error.message);
            throw new Error('Failed to sync Google Drive data');
        }
    }

    async fetchActivity(tokens: any): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get recent files
            const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params: {
                    pageSize: 20,
                    orderBy: 'modifiedTime desc',
                    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,owners,shared)',
                },
            });

            return response.data.files || [];
        } catch (error) {
            console.error('[GoogleDrive] Fetch activity failed:', error.response?.data || error.message);
            return [];
        }
    }

    async listFiles(tokens: any, pageSize: number = 50, pageToken?: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const params: any = {
                pageSize,
                orderBy: 'modifiedTime desc',
                fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,iconLink,owners,shared,size)',
            };

            if (pageToken) {
                params.pageToken = pageToken;
            }

            const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params,
            });

            return {
                files: response.data.files || [],
                nextPageToken: response.data.nextPageToken,
            };
        } catch (error) {
            console.error('[GoogleDrive] List files failed:', error.response?.data || error.message);
            throw new Error('Failed to list files');
        }
    }

    async searchFiles(tokens: any, query: string): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params: {
                    pageSize: 20,
                    q: `name contains '${query}' or fullText contains '${query}'`,
                    orderBy: 'modifiedTime desc',
                    fields: 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,owners,shared)',
                },
            });

            return response.data.files || [];
        } catch (error) {
            console.error('[GoogleDrive] Search failed:', error.response?.data || error.message);
            return [];
        }
    }
}
