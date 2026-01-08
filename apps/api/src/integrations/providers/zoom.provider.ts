import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class ZoomProvider implements IProvider {
    name = 'zoom';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('ZOOM_CLIENT_ID');

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
        });

        return `https://zoom.us/oauth/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        try {
            const clientId = this.config.get('ZOOM_CLIENT_ID');
            const clientSecret = this.config.get('ZOOM_CLIENT_SECRET');

            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            const response = await axios.post(
                'https://zoom.us/oauth/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                }),
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('[Zoom] Token exchange failed:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for token');
        }
    }

    async refreshTokens(refreshToken: string): Promise<any> {
        try {
            const clientId = this.config.get('ZOOM_CLIENT_ID');
            const clientSecret = this.config.get('ZOOM_CLIENT_SECRET');

            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

            const response = await axios.post(
                'https://zoom.us/oauth/token',
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('[Zoom] Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh token');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // 1. Get Scheduled Meetings (Upcoming)
            const meetingsResponse = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
                headers,
                params: { type: 'scheduled', page_size: 50 },
            });
            const scheduled = (meetingsResponse.data.meetings || []).map((m: any) => ({
                id: m.id.toString(),
                title: m.topic,
                startTime: new Date(m.start_time),
                endTime: new Date(new Date(m.start_time).getTime() + m.duration * 60000),
                summary: m.agenda,
                recordingUrl: m.join_url,
                videoProvider: 'zoom'
            }));


            // 2. Get Recordings (Past with potential transcripts)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recordingsResponse = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
                headers,
                params: {
                    from: thirtyDaysAgo.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                }
            });

            const recordings = recordingsResponse.data.meetings || [];
            const processedRecordings = await Promise.all(recordings.map(async (rec: any) => {
                let transcript = null;

                // Find transcript file
                const validFiles = rec.recording_files || [];
                const transcriptFile = validFiles.find((f: any) => f.file_type === 'TRANSCRIPT');

                if (transcriptFile && transcriptFile.download_url) {
                    try {
                        // Fetch the actual VTT/Text content
                        // Zoom requires access_token as a query param for file downloads
                        const downloadUrl = `${transcriptFile.download_url}?access_token=${tokens.access_token}`;
                        const dlRes = await axios.get(downloadUrl);

                        let originalTranscript = dlRes.data;

                        // Simple VTT cleanup (remove timestamps and header)
                        // This converts "WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nHello world" to "Hello world"
                        if (typeof originalTranscript === 'string' && originalTranscript.includes('WEBVTT')) {
                            transcript = originalTranscript
                                .replace(/WEBVTT\s+/, '')
                                .replace(/(\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}\.\d{3}.*?\n/g, '') // Remove timestamps
                                .replace(/^\d+\s+$/gm, '') // Remove sequence numbers
                                .replace(/\r?\n\r?\n/g, '\n') // Remove extra newlines
                                .trim();
                        } else {
                            transcript = originalTranscript;
                        }

                        console.log(`[Zoom] Downloaded and processed transcript for ${rec.id}. Length: ${transcript?.length}`);

                    } catch (e) {
                        console.warn(`[Zoom] Failed to download transcript for ${rec.id}`, e.message);
                    }
                }

                return {
                    id: rec.id.toString(),
                    title: rec.topic,
                    startTime: new Date(rec.start_time),
                    endTime: new Date(new Date(rec.start_time).getTime() + rec.duration * 60000),
                    summary: 'Zoom Cloud Recording',
                    transcript: transcript || undefined, // undefined to ensure clean DB insert if null
                    recordingUrl: rec.share_url,
                    videoProvider: 'zoom'
                };
            }));

            return {
                meetings: [...scheduled, ...processedRecordings],
                customData: {
                    totalMeetings: scheduled.length + processedRecordings.length
                },
            };
        } catch (error) {
            console.error('[Zoom] Sync failed:', error.response?.data || error.message);
            throw new Error('Failed to sync Zoom data');
        }
    }

    async listMeetings(tokens: any, type: string = 'scheduled'): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
                headers,
                params: {
                    type,
                    page_size: 100,
                },
            });

            return response.data.meetings || [];
        } catch (error) {
            console.error('[Zoom] List meetings failed:', error.response?.data || error.message);
            return [];
        }
    }

    async getMeetingDetails(tokens: any, meetingId: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
                headers,
            });

            return response.data;
        } catch (error) {
            console.error('[Zoom] Get meeting details failed:', error.response?.data || error.message);
            throw new Error('Failed to get meeting details');
        }
    }

    async getRecordings(tokens: any, from?: string, to?: string): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const params: any = {
                from: from || thirtyDaysAgo.toISOString().split('T')[0],
                to: to || new Date().toISOString().split('T')[0],
            };

            const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
                headers,
                params,
            });

            return response.data.meetings || [];
        } catch (error) {
            console.error('[Zoom] Get recordings failed:', error.response?.data || error.message);
            return [];
        }
    }
}
