import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class GoogleDocsProvider implements IProvider {
    name = 'google_docs';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const scopes = [
            'https://www.googleapis.com/auth/documents.readonly',
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
            console.error('[GoogleDocs] Token exchange failed:', error.response?.data || error.message);
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
            console.error('[GoogleDocs] Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh token');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get recent Google Docs (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Query for Google Docs files only
            const docsResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params: {
                    pageSize: 50,
                    orderBy: 'modifiedTime desc',
                    fields: 'files(id,name,modifiedTime,webViewLink,iconLink,owners,shared,createdTime,description)',
                    q: `mimeType='application/vnd.google-apps.document' and modifiedTime > '${thirtyDaysAgo.toISOString()}'`,
                },
            });

            const docs = docsResponse.data.files || [];

            // Get user info
            const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers,
            });

            const userEmail = userInfoResponse.data.email;

            // Transform docs into structured data
            const documentData = docs.map((doc: any) => {
                const isNew = new Date(doc.createdTime) > thirtyDaysAgo;
                const action = isNew ? 'created' : 'updated';

                return {
                    id: doc.id,
                    title: doc.name,
                    description: doc.description || `Document ${action}`,
                    link: doc.webViewLink,
                    modifiedTime: new Date(doc.modifiedTime),
                    createdTime: new Date(doc.createdTime),
                    isNew,
                    shared: doc.shared,
                    owner: doc.owners?.[0]?.displayName || userEmail,
                };
            });

            return {
                customData: {
                    documents: documentData,
                    totalDocuments: docs.length,
                    userEmail,
                },
            };
        } catch (error) {
            console.error('[GoogleDocs] Sync failed:', error.response?.data || error.message);
            throw new Error('Failed to sync Google Docs data');
        }
    }

    async listDocuments(tokens: any, pageSize: number = 50, pageToken?: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const params: any = {
                pageSize,
                orderBy: 'modifiedTime desc',
                fields: 'nextPageToken,files(id,name,modifiedTime,webViewLink,iconLink,owners,shared,description)',
                q: "mimeType='application/vnd.google-apps.document'",
            };

            if (pageToken) {
                params.pageToken = pageToken;
            }

            const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params,
            });

            return {
                documents: response.data.files || [],
                nextPageToken: response.data.nextPageToken,
            };
        } catch (error) {
            console.error('[GoogleDocs] List documents failed:', error.response?.data || error.message);
            throw new Error('Failed to list documents');
        }
    }

    async getDocumentContent(tokens: any, documentId: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get document content from Google Docs API
            const response = await axios.get(`https://docs.googleapis.com/v1/documents/${documentId}`, {
                headers,
            });

            return response.data;
        } catch (error) {
            console.error('[GoogleDocs] Get document content failed:', error.response?.data || error.message);
            throw new Error('Failed to get document content');
        }
    }

    async searchDocuments(tokens: any, query: string): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers,
                params: {
                    pageSize: 20,
                    q: `mimeType='application/vnd.google-apps.document' and (name contains '${query}' or fullText contains '${query}')`,
                    orderBy: 'modifiedTime desc',
                    fields: 'files(id,name,modifiedTime,webViewLink,iconLink,owners,shared,description)',
                },
            });

            return response.data.files || [];
        } catch (error) {
            console.error('[GoogleDocs] Search failed:', error.response?.data || error.message);
            return [];
        }
    }
}
