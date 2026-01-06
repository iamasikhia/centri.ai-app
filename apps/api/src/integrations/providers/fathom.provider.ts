import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class FathomProvider implements IProvider {
    name = 'fathom';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('FATHOM_CLIENT_ID');

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'read',
        });

        return `https://app.fathom.video/oauth/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        try {
            const clientId = this.config.get('FATHOM_CLIENT_ID');
            const clientSecret = this.config.get('FATHOM_CLIENT_SECRET');

            const response = await axios.post(
                'https://app.fathom.video/oauth/token',
                {
                    grant_type: 'authorization_code',
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('[Fathom] Token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for token');
        }
    }

    async refreshTokens(refreshToken: string): Promise<any> {
        try {
            const clientId = this.config.get('FATHOM_CLIENT_ID');
            const clientSecret = this.config.get('FATHOM_CLIENT_SECRET');

            const response = await axios.post(
                'https://app.fathom.video/oauth/token',
                {
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('[Fathom] Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh token');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get recordings from the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recordingsResponse = await axios.get('https://app.fathom.video/api/v1/calls', {
                headers,
                params: {
                    start_date: thirtyDaysAgo.toISOString(),
                    limit: 100,
                },
            });

            const recordings = recordingsResponse.data.calls || [];

            // Transform recordings into meetings
            const meetings = recordings.map((recording: any) => ({
                id: recording.id,
                title: recording.title || 'Untitled Recording',
                description: recording.summary || '',
                startTime: recording.start_time,
                endTime: recording.end_time,
                duration: recording.duration,
                recordingUrl: recording.recording_url,
                transcriptUrl: recording.transcript_url,
                highlights: recording.highlights || [],
                actionItems: recording.action_items || [],
                participants: recording.participants || [],
            }));

            return {
                meetings,
                customData: {
                    totalRecordings: recordings.length,
                    totalHighlights: recordings.reduce((sum: number, r: any) => sum + (r.highlights?.length || 0), 0),
                    totalActionItems: recordings.reduce((sum: number, r: any) => sum + (r.action_items?.length || 0), 0),
                },
            };
        } catch (error) {
            console.error('[Fathom] Sync failed:', error.response?.data || error.message);
            throw new Error('Failed to sync Fathom data');
        }
    }

    async listRecordings(tokens: any, limit: number = 50): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get('https://app.fathom.video/api/v1/calls', {
                headers,
                params: { limit },
            });

            return response.data.calls || [];
        } catch (error) {
            console.error('[Fathom] List recordings failed:', error.response?.data || error.message);
            return [];
        }
    }

    async getRecordingDetails(tokens: any, recordingId: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get(`https://app.fathom.video/api/v1/calls/${recordingId}`, {
                headers,
            });

            return response.data;
        } catch (error) {
            console.error('[Fathom] Get recording details failed:', error.response?.data || error.message);
            throw new Error('Failed to get recording details');
        }
    }

    async getTranscript(tokens: any, recordingId: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get(`https://app.fathom.video/api/v1/calls/${recordingId}/transcript`, {
                headers,
            });

            return response.data;
        } catch (error) {
            console.error('[Fathom] Get transcript failed:', error.response?.data || error.message);
            throw new Error('Failed to get transcript');
        }
    }

    async getHighlights(tokens: any, recordingId: string): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get(`https://app.fathom.video/api/v1/calls/${recordingId}/highlights`, {
                headers,
            });

            return response.data.highlights || [];
        } catch (error) {
            console.error('[Fathom] Get highlights failed:', error.response?.data || error.message);
            return [];
        }
    }
}
