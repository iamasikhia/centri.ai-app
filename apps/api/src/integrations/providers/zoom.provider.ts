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

            // Get user info
            const userResponse = await axios.get('https://api.zoom.us/v2/users/me', { headers });
            const userEmail = userResponse.data.email;

            // Get meetings (upcoming and recent)
            const meetingsResponse = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
                headers,
                params: {
                    type: 'scheduled',
                    page_size: 100,
                },
            });

            const meetings = meetingsResponse.data.meetings || [];

            // Transform meetings
            const transformedMeetings = meetings.map((meeting: any) => ({
                id: meeting.id.toString(),
                title: meeting.topic,
                description: meeting.agenda || '',
                startTime: meeting.start_time,
                duration: meeting.duration,
                joinUrl: meeting.join_url,
                meetingType: meeting.type === 2 ? 'scheduled' : meeting.type === 3 ? 'recurring' : 'instant',
                status: meeting.status,
                timezone: meeting.timezone,
            }));

            return {
                meetings: transformedMeetings,
                customData: {
                    totalMeetings: meetings.length,
                    userEmail,
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
