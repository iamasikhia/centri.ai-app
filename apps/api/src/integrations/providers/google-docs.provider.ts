import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class GoogleDocsProvider implements IProvider {
    name = 'google_docs';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const scopes = [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive.file',
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
    async createDocument(tokens: any, title: string, content: string): Promise<string> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // 1. Create Document
            const createRes = await axios.post('https://docs.googleapis.com/v1/documents', {
                title: title
            }, { headers });

            const docId = createRes.data.documentId;

            // 2. Parse Markdown and Prepare Requests
            if (content) {
                const requests = [];
                let currentIndex = 1; // Docs start at index 1
                let plainText = '';

                const lines = content.split('\n');

                for (const line of lines) {
                    let textToProcess = line;
                    let paragraphStyle = 'NORMAL_TEXT';
                    let isBullet = false;

                    // Detect Heading / List
                    if (line.startsWith('# ')) {
                        paragraphStyle = 'HEADING_1';
                        textToProcess = line.substring(2);
                    } else if (line.startsWith('## ')) {
                        paragraphStyle = 'HEADING_2';
                        textToProcess = line.substring(3);
                    } else if (line.startsWith('### ')) {
                        paragraphStyle = 'HEADING_3';
                        textToProcess = line.substring(4);
                    } else if (line.startsWith('- ')) {
                        textToProcess = line.substring(2);
                        isBullet = true;
                    }

                    // Handle Bold (Simple match: **text**)
                    // We need to strip ** and track indices relative to `plainText` length + 1
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    let match;
                    let lastIndex = 0;
                    let linePlainText = '';
                    const boldRanges = [];

                    // Reset regex state
                    while ((match = boldRegex.exec(textToProcess)) !== null) {
                        // Text before bold
                        const before = textToProcess.substring(lastIndex, match.index);
                        linePlainText += before;

                        // Bold text
                        const boldText = match[1];
                        const boldStart = currentIndex + linePlainText.length;
                        linePlainText += boldText;
                        const boldEnd = currentIndex + linePlainText.length;

                        boldRanges.push({ start: boldStart, end: boldEnd });

                        lastIndex = boldRegex.lastIndex;
                    }
                    // Remaining text
                    linePlainText += textToProcess.substring(lastIndex);

                    const lineStart = currentIndex;

                    // Append to full text buffer
                    plainText += linePlainText + '\n';
                    currentIndex += linePlainText.length + 1; // +1 for newline

                    // Create Requests

                    // 1. Paragraph Style (Headings)
                    if (paragraphStyle !== 'NORMAL_TEXT') {
                        requests.push({
                            updateParagraphStyle: {
                                range: { startIndex: lineStart, endIndex: currentIndex - 1 }, // Exclude newline usually
                                paragraphStyle: { namedStyleType: paragraphStyle },
                                fields: 'namedStyleType'
                            }
                        });
                    }

                    // 2. Bold Styles
                    boldRanges.forEach(range => {
                        requests.push({
                            updateTextStyle: {
                                range: { startIndex: range.start, endIndex: range.end },
                                textStyle: { bold: true },
                                fields: 'bold'
                            }
                        });
                    });

                    // 3. Bullets
                    if (isBullet) {
                        requests.push({
                            createParagraphBullets: {
                                range: { startIndex: lineStart, endIndex: currentIndex - 1 },
                                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE'
                            }
                        });
                    }
                }

                // First request: Insert all text
                requests.unshift({
                    insertText: {
                        location: { index: 1 },
                        text: plainText
                    }
                });

                await axios.post(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
                    requests
                }, { headers });
            }

            return `https://docs.google.com/document/d/${docId}/edit`;
        } catch (error) {
            const msg = error.response?.data?.error?.message || error.message;
            console.error('[GoogleDocs] Create document failed:', msg);
            throw new Error(`Failed to create document: ${msg}`);
        }
    }
}
