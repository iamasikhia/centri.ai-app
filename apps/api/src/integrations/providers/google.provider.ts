import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class GoogleProvider implements IProvider {
  name = 'google';

  constructor(private config: ConfigService) { }

  getAuthUrl(redirectUri: string): string {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<any> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      return response.data;
    } catch (error) {
      console.error('[GoogleProvider] Token Exchange Failed:', error.response?.data || error.message);
      console.error('[GoogleProvider] Redirect URI used:', redirectUri);
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      });
      return response.data;
    } catch (error) {
      console.error('[GoogleProvider] Token Refresh Failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async syncData(userId: string, tokens: any): Promise<SyncResult> {
    // 1. Fetch Meetings
    // 2. Fetch User Info (for team member discovery if applicable)

    const meetings = [];
    const tasks = [];

    try {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const calRes = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (calRes.data.items) {
        for (const item of calRes.data.items) {
          const attendees = item.attendees || [];
          const hasConference = !!item.conferenceData || !!item.hangoutLink;
          const isSelf = item.organizer?.self || false;

          // Classification Logic:
          // Task if: (No attendees OR only self) AND (No conference link)
          // Meeting if: (Attendees > 1) OR (Has conference link)

          // Exception: If title contains "Meeting", "Sync", "Call", treat as Meeting even if solo (e.g. "Prep for meeting")
          // Actually, "Prep" is a task. "Sync" with self is weird.
          // Let's stick to the structural signals.

          const isMeeting = (attendees.length > 1) || hasConference;

          const commonFields = {
            id: item.id,
            calendarEventId: item.id,
            title: item.summary || 'No Title',
            startTime: new Date(item.start.dateTime || item.start.date),
            endTime: new Date(item.end.dateTime || item.end.date),
            description: item.description || null,
            htmlLink: item.htmlLink || null,
          };

          if (isMeeting) {
            // Determine duration
            const durationMinutes = (commonFields.endTime.getTime() - commonFields.startTime.getTime()) / (1000 * 60);

            meetings.push({
              ...commonFields,
              attendeesJson: JSON.stringify(attendees),
              location: item.location || null,
              meetLink: item.hangoutLink || null,
              rawAttendeesCount: attendees.length,
              hasConference: hasConference,
              isSelfOrganized: isSelf,
              durationMinutes: durationMinutes
            });
          } else {
            // It's a Task
            tasks.push({
              ...commonFields,
              status: 'pending', // Default for calendar-based tasks
              dueDate: commonFields.endTime // Use end time as deadline? Or start? usually Tasks have due dates. Start time = do date.
            });
          }
        }
      }
    } catch (e) {
      console.error('Google Sync Error', e.response?.data || e.message);
    }

    return {
      meetings,
      tasks
    };
  }
}
