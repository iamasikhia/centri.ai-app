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
    try {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const calRes = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (calRes.data.items) {
        meetings.push(...calRes.data.items);
      }
    } catch (e) {
      console.error('Google Sync Error', e.response?.data || e.message);
    }

    return {
      meetings: meetings.map(m => {
        const start = new Date(m.start.dateTime || m.start.date);
        const end = new Date(m.end.dateTime || m.end.date);
        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

        return {
          calendarEventId: m.id,
          title: m.summary || 'No Title',
          startTime: start,
          endTime: end,
          attendeesJson: JSON.stringify(m.attendees || []),
          location: m.location || null,
          description: m.description || null,
          meetLink: m.hangoutLink || null,
          htmlLink: m.htmlLink || null,
          // Extra fields for classification
          rawAttendeesCount: (m.attendees || []).length,
          hasConference: !!m.conferenceData || !!m.hangoutLink,
          isSelfOrganized: m.organizer?.self || false,
          durationMinutes: durationMinutes
        };
      })
    };
  }
}
