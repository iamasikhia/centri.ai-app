import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';

export class GoogleMeetProvider implements IProvider {
    name = 'google_meet';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly',
            'https://www.googleapis.com/auth/meetings.space.readonly',
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
            console.error('[GoogleMeet] Token exchange failed:', error.response?.data || error.message);
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
            console.error('[GoogleMeet] Token refresh failed:', error.response?.data || error.message);
            throw new Error('Failed to refresh token');
        }
    }

    async syncData(userId: string, tokens: any): Promise<SyncResult> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            // Get meetings from the last 7 days and next 30 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            // Fetch calendar events with Google Meet links
            const eventsResponse = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                headers,
                params: {
                    timeMin: sevenDaysAgo.toISOString(),
                    timeMax: thirtyDaysFromNow.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults: 100,
                },
            });

            const events = eventsResponse.data.items || [];

            // Filter for events with Google Meet links
            const meetEvents = events.filter((event: any) =>
                event.hangoutLink ||
                event.conferenceData?.entryPoints?.some((ep: any) => ep.entryPointType === 'video')
            );

            // Transform into meetings
            const meetings = meetEvents.map((event: any) => {
                const meetLink = event.hangoutLink ||
                    event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

                return {
                    id: event.id,
                    title: event.summary || 'Untitled Meeting',
                    description: event.description || '',
                    startTime: event.start?.dateTime || event.start?.date,
                    endTime: event.end?.dateTime || event.end?.date,
                    meetLink,
                    attendees: event.attendees?.map((a: any) => ({
                        email: a.email,
                        displayName: a.displayName,
                        responseStatus: a.responseStatus,
                    })) || [],
                    organizer: {
                        email: event.organizer?.email,
                        displayName: event.organizer?.displayName,
                    },
                    status: event.status,
                    created: event.created,
                    updated: event.updated,
                };
            });

            return {
                meetings,
                customData: {
                    totalMeetings: meetings.length,
                    upcomingMeetings: meetings.filter((m: any) => new Date(m.startTime) > new Date()).length,
                    pastMeetings: meetings.filter((m: any) => new Date(m.endTime) < new Date()).length,
                },
            };
        } catch (error) {
            console.error('[GoogleMeet] Sync failed:', error.response?.data || error.message);
            throw new Error('Failed to sync Google Meet data');
        }
    }

    async listUpcomingMeetings(tokens: any, maxResults: number = 20): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const now = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                headers,
                params: {
                    timeMin: now.toISOString(),
                    timeMax: thirtyDaysFromNow.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    maxResults,
                },
            });

            const events = response.data.items || [];

            // Filter for Google Meet events
            return events.filter((event: any) =>
                event.hangoutLink ||
                event.conferenceData?.entryPoints?.some((ep: any) => ep.entryPointType === 'video')
            );
        } catch (error) {
            console.error('[GoogleMeet] List upcoming meetings failed:', error.response?.data || error.message);
            return [];
        }
    }

    async getMeetingDetails(tokens: any, eventId: string): Promise<any> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                { headers }
            );

            return response.data;
        } catch (error) {
            console.error('[GoogleMeet] Get meeting details failed:', error.response?.data || error.message);
            throw new Error('Failed to get meeting details');
        }
    }
}
