import axios from 'axios';
import { IProvider, SyncResult } from './provider.interface';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

export class FathomProvider implements IProvider {
    name = 'fathom';

    constructor(private config: ConfigService) { }

    getAuthUrl(redirectUri: string): string {
        const clientId = this.config.get('FATHOM_CLIENT_ID');

        // Generate a random state for CSRF protection
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'public_api',
            state: state,
        });

        return `https://fathom.video/external/v1/oauth2/authorize?${params.toString()}`;
    }

    async exchangeCode(code: string, redirectUri: string): Promise<any> {
        try {
            const clientId = this.config.get('FATHOM_CLIENT_ID');
            const clientSecret = this.config.get('FATHOM_CLIENT_SECRET');

            console.log('[Fathom] Attempting token exchange...');
            console.log('[Fathom] Redirect URI:', redirectUri);
            console.log('[Fathom] Code length:', code?.length);

            // Fathom expects form-urlencoded, not JSON
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
            });

            const response = await axios.post(
                'https://fathom.video/external/v1/oauth2/token',
                params.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            console.log('[Fathom] Token exchange successful!');
            return response.data;
        } catch (error) {
            console.error('[Fathom] Token exchange failed!');
            console.error('[Fathom] Error status:', error.response?.status);
            console.error('[Fathom] Error data:', JSON.stringify(error.response?.data, null, 2));
            console.error('[Fathom] Error message:', error.message);
            throw new Error(`Failed to exchange code for token: ${error.response?.data?.error || error.message}`);
        }
    }

    async refreshTokens(refreshToken: string): Promise<any> {
        try {
            const clientId = this.config.get('FATHOM_CLIENT_ID');
            const clientSecret = this.config.get('FATHOM_CLIENT_SECRET');

            const response = await axios.post(
                'https://fathom.video/external/v1/oauth2/token',
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

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Fetch Calls (Meetings)
            const recordingsResponse = await axios.get('https://api.fathom.ai/external/v1/meetings', {
                headers,
                params: {
                    limit: 100,
                },
            });

            const recordings = recordingsResponse.data.items || recordingsResponse.data.meetings || [];

            console.log(`[Fathom] Sync found ${recordings.length} recordings.`);

            // 2. Process each call to get detailed transcript
            const processedMeetings = await Promise.all(recordings.map(async (rec: any) => {
                const meetingId = rec.id || rec.recording_id;

                // Fetch detailed meeting info to get duration and complete data
                let meetingDetails = rec;
                try {
                    const detailsResponse = await axios.get(`https://api.fathom.ai/external/v1/meetings/${meetingId}`, {
                        headers,
                    });
                    meetingDetails = detailsResponse.data;
                    console.log(`[Fathom] Fetched details for ${meetingId}:`, JSON.stringify(meetingDetails, null, 2));
                } catch (e) {
                    console.warn(`[Fathom] Could not fetch details for ${meetingId}, using list data:`, e.message);
                }

                let transcriptSegments = [];
                let fullTranscriptText = '';

                try {
                    let transcriptData = await this.getTranscript(tokens, meetingId);

                    if (Array.isArray(transcriptData)) {
                        transcriptSegments = transcriptData.map((t: any) => ({
                            speaker: t.speaker_name || t.speaker?.display_name || 'Unknown',
                            text: t.text,
                            timestamp: t.timestamp || 0,
                            isHighlighted: false
                        }));
                        fullTranscriptText = transcriptSegments.map(t => `${t.speaker}: ${t.text}`).join('\n');
                    } else if (transcriptData && Array.isArray(transcriptData.transcript)) {
                        transcriptSegments = transcriptData.transcript.map((t: any) => ({
                            speaker: t.speaker?.display_name || t.speaker_name || 'Unknown',
                            text: t.text,
                            timestamp: t.timestamp || 0,
                            isHighlighted: false
                        }));
                        fullTranscriptText = transcriptSegments.map(t => `${t.speaker}: ${t.text}`).join('\n');
                    } else if (transcriptData && typeof transcriptData.transcript === 'string') {
                        // Handle plain text
                        fullTranscriptText = transcriptData.transcript;
                    }

                } catch (e) {
                    console.warn(`[Fathom] Transcript not ready or failed for ${meetingId}`, e.message);
                }
                console.log(`[Fathom] Processed ${meetingId}: text len=${fullTranscriptText.length}, segments=${transcriptSegments.length}`);

                // Duration handling: Fathom API uses scheduled_start_time and scheduled_end_time
                // There is NO duration field - we must calculate it
                const startTime = meetingDetails.scheduled_start_time || meetingDetails.recording_start_time || meetingDetails.created_at;
                const endTime = meetingDetails.scheduled_end_time;

                console.log(`[Fathom] Meeting ${meetingId} - Start: ${startTime}, End: ${endTime}`);

                // Calculate duration from start and end times
                let durationInSeconds = 0;
                if (startTime && endTime) {
                    durationInSeconds = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
                    console.log(`[Fathom] Calculated duration for ${meetingId}: ${durationInSeconds}s (${Math.floor(durationInSeconds / 60)} mins)`);
                } else {
                    console.warn(`[Fathom] Missing start or end time for ${meetingId}, duration will be 0`);
                }

                console.log(`[Fathom] Final times for ${meetingId} - Start: ${startTime}, End: ${endTime || startTime}, Duration: ${durationInSeconds}s`);

                return {
                    id: meetingId.toString(),
                    calendarEventId: `fathom_${meetingId}`, // Required field for database
                    title: meetingDetails.title || 'Untitled Meeting',
                    description: meetingDetails.summary || '', // AI Summary
                    startTime: startTime,
                    endTime: endTime || startTime, // Fallback to startTime if still missing
                    duration: durationInSeconds, // Store in seconds for consistency
                    durationMinutes: Math.floor(durationInSeconds / 60), // For classification in sync service
                    recordingUrl: meetingDetails.recording_url || meetingDetails.url,
                    transcript: fullTranscriptText, // Raw text for storage/display
                    transcriptUrl: meetingDetails.transcript_url,
                    highlights: meetingDetails.highlights || [],
                    actionItems: meetingDetails.action_items || [],
                    participants: meetingDetails.participants || [],
                    attendeesJson: JSON.stringify(meetingDetails.participants || []), // Required field
                    // Custom fields for Intelligence Pipeline
                    videoProvider: 'fathom',
                    status: fullTranscriptText ? 'processed' : 'processing', // Infer status based on data
                    transcriptJson: transcriptSegments.length > 0 ? transcriptSegments : null
                };
            }));

            return {
                meetings: processedMeetings,
                customData: {
                    totalRecordings: recordings.length,
                    processedCount: processedMeetings.filter(m => m.status === 'processed').length
                },
            };
        } catch (error) {
            console.error('[Fathom] Sync failed details:', JSON.stringify(error.response?.data || {}, null, 2));
            console.error('[Fathom] Sync failed message:', error.message);
            throw new Error('Failed to sync Fathom data');
        }
    }

    async listRecordings(tokens: any, limit: number = 50): Promise<any[]> {
        try {
            const headers = {
                Authorization: `Bearer ${tokens.access_token}`,
            };

            const response = await axios.get('https://api.fathom.ai/external/v1/meetings', {
                headers,
                params: { limit },
            });

            return response.data.items || response.data.meetings || [];
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

            const response = await axios.get(`https://api.fathom.ai/external/v1/meetings/${recordingId}`, {
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

            const response = await axios.get(`https://api.fathom.ai/external/v1/recordings/${recordingId}/transcript`, {
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

            const response = await axios.get(`https://api.fathom.ai/external/v1/recordings/${recordingId}/highlights`, {
                headers,
            });

            return response.data.highlights || [];
        } catch (error) {
            console.error('[Fathom] Get highlights failed:', error.response?.data || error.message);
            return [];
        }
    }
}
