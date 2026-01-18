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
            'https://www.googleapis.com/auth/drive.readonly', // Needed for transcript access
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

            // Transform into meetings with transcript fetching
            const meetings = await Promise.all(meetEvents.map(async (event: any) => {
                const meetLink = event.hangoutLink ||
                    event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

                let transcript = null;
                let recordingUrl = null;

                // Try to find transcript from Google Drive (Meet Recordings folder)
                // Google Meet saves transcripts to Drive after meetings with transcription enabled
                if (event.end?.dateTime && new Date(event.end.dateTime) < new Date()) {
                    // Only check for transcripts for past meetings
                    try {
                        const transcriptData = await this.findTranscriptFromDrive(headers, event);
                        if (transcriptData) {
                            transcript = transcriptData.text;
                            recordingUrl = transcriptData.recordingUrl;
                            console.log(`[GoogleMeet] Found transcript for event ${event.id}. Length: ${transcript?.length}`);
                        }
                    } catch (e) {
                        console.warn(`[GoogleMeet] Failed to fetch transcript for ${event.id}:`, e.message);
                    }
                }

                return {
                    id: event.id,
                    calendarEventId: event.id,
                    title: event.summary || 'Untitled Meeting',
                    description: event.description || '',
                    startTime: event.start?.dateTime || event.start?.date,
                    endTime: event.end?.dateTime || event.end?.date,
                    meetLink,
                    transcript: transcript || undefined,
                    recordingUrl: recordingUrl || undefined,
                    videoProvider: 'google_meet',
                    participants: event.attendees?.map((a: any) => ({
                        email: a.email,
                        displayName: a.displayName,
                        responseStatus: a.responseStatus,
                    })) || [],
                    attendeesJson: JSON.stringify(event.attendees?.map((a: any) => ({
                        email: a.email,
                        displayName: a.displayName,
                        responseStatus: a.responseStatus,
                    })) || []),
                    organizer: {
                        email: event.organizer?.email,
                        displayName: event.organizer?.displayName,
                    },
                    status: event.status,
                    created: event.created,
                    updated: event.updated,
                };
            }));

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

    /**
     * Find transcript from Google Drive for a meeting event
     * Google Meet saves transcripts to Drive in "Meet Recordings" folder
     */
    private async findTranscriptFromDrive(headers: any, event: any): Promise<{ text: string; recordingUrl?: string } | null> {
        try {
            const eventStartTime = new Date(event.start?.dateTime || event.start?.date);
            const eventEndTime = new Date(event.end?.dateTime || event.end?.date);
            const eventTitle = event.summary || 'Untitled Meeting';

            // Search for files in Drive related to this meeting
            // Google Meet typically saves transcripts as text files in "Meet Recordings" folder
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Look for transcript files - Google Meet saves them with .txt extension or as Google Docs
            // Search in "Meet Recordings" folder or files matching the meeting title/date
            const searchQueries = [
                `name contains '${eventTitle}' and (mimeType='text/plain' or mimeType='application/vnd.google-apps.document') and modifiedTime > '${sevenDaysAgo.toISOString()}'`,
                `name contains 'Meet Recording' and modifiedTime > '${sevenDaysAgo.toISOString()}'`,
                `fullText contains '${eventTitle.substring(0, 20)}' and (mimeType='text/plain' or mimeType='application/vnd.google-apps.document')`,
            ];

            for (const query of searchQueries) {
                try {
                    const filesResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
                        headers,
                        params: {
                            q: query,
                            pageSize: 10,
                            orderBy: 'modifiedTime desc',
                            fields: 'files(id,name,mimeType,webViewLink,modifiedTime,createdTime)',
                        },
                    });

                    const files = filesResponse.data.files || [];

                    // Try to find the most relevant file (by date or name match)
                    for (const file of files) {
                        const fileDate = new Date(file.modifiedTime || file.createdTime);
                        
                        // Check if file date is close to meeting date (within 1 day)
                        const dateDiff = Math.abs(fileDate.getTime() - eventEndTime.getTime());
                        if (dateDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
                            try {
                                let transcriptText = '';

                                if (file.mimeType === 'application/vnd.google-apps.document') {
                                    // Export Google Doc as plain text
                                    const exportResponse = await axios.get(
                                        `https://www.googleapis.com/drive/v3/files/${file.id}/export`,
                                        {
                                            headers,
                                            params: { mimeType: 'text/plain' },
                                            responseType: 'text',
                                        }
                                    );
                                    transcriptText = exportResponse.data;
                                } else if (file.mimeType === 'text/plain') {
                                    // Download text file directly
                                    const downloadResponse = await axios.get(
                                        `https://www.googleapis.com/drive/v3/files/${file.id}`,
                                        {
                                            headers: {
                                                ...headers,
                                                Accept: 'text/plain',
                                            },
                                            params: { alt: 'media' },
                                            responseType: 'text',
                                        }
                                    );
                                    transcriptText = downloadResponse.data;
                                }

                                if (transcriptText && transcriptText.length > 100) {
                                    // Clean up the transcript (remove timestamps if present)
                                    transcriptText = transcriptText
                                        .replace(/\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps like 00:00:00
                                        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
                                        .trim();

                                    return {
                                        text: transcriptText,
                                        recordingUrl: file.webViewLink,
                                    };
                                }
                            } catch (e) {
                                console.warn(`[GoogleMeet] Failed to read file ${file.id}:`, e.message);
                                continue;
                            }
                        }
                    }
                } catch (e) {
                    // Continue to next query if this one fails
                    continue;
                }
            }

            return null;
        } catch (error) {
            console.warn('[GoogleMeet] Drive search failed:', error.response?.data || error.message);
            return null;
        }
    }
}
