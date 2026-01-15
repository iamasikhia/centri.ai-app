import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class SlackProvider implements IProvider {
  name = 'slack';

  constructor(private config: ConfigService) { }

  getAuthUrl(redirectUri: string): string {
    const clientId = this.config.get('SLACK_CLIENT_ID');
    const scopes = 'users:read,users:read.email,channels:read,groups:read,im:read,mpim:read,channels:history,groups:history,mpim:history,im:history,chat:write';
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  // Method to Post Message
  // Method to Post Message
  async postMessage(token: string, channelId: string, text: string): Promise<{ ok: boolean; ts?: string; error?: string }> {
    try {
      const res = await axios.post('https://slack.com/api/chat.postMessage', {
        channel: channelId,
        text: text,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.data.ok) {
        console.warn(`[Slack] Failed to send message to ${channelId}:`, res.data.error);
        return { ok: false, error: res.data.error };
      }
      return { ok: true, ts: res.data.ts };
    } catch (e) {
      console.error(`[Slack] Error sending message to ${channelId}:`, e.message);
      return { ok: false, error: e.message || 'Unknown network error' };
    }
  }

  async getHistory(token: string, channelId: string, limit: number = 5): Promise<any[]> {
    try {
      const res = await axios.get('https://slack.com/api/conversations.history', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          channel: channelId,
          limit: limit
        }
      });
      if (res.data.ok) {
        return res.data.messages || [];
      }
      console.warn(`[Slack] Failed to fetch history for ${channelId}:`, res.data.error);
      return [];
    } catch (e) {
      console.error(`[Slack] Error fetching history for ${channelId}:`, e.message);
      return [];
    }
  }

  /**
   * Fetches threaded replies for a specific message.
   * @param token Slack access token
   * @param channelId Channel where the message was posted
   * @param threadTs Timestamp of the parent message (the check-in)
   * @returns Array of replies
   */
  async getThreadReplies(token: string, channelId: string, threadTs: string): Promise<any[]> {
    try {
      const res = await axios.get('https://slack.com/api/conversations.replies', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          channel: channelId,
          ts: threadTs, // The parent message timestamp
          limit: 100
        }
      });
      if (res.data.ok) {
        // The first message in the array is the parent, rest are replies
        return res.data.messages?.slice(1) || [];
      }
      console.warn(`[Slack] Failed to fetch thread replies for ${threadTs}:`, res.data.error);
      return [];
    } catch (e) {
      console.error(`[Slack] Error fetching thread replies for ${threadTs}:`, e.message);
      return [];
    }
  }

  /**
   * Fetches all channel messages that came AFTER a specific timestamp.
   * This captures responses that aren't in a thread.
   * @param token Slack access token  
   * @param channelId Channel to fetch from
   * @param afterTs Only fetch messages after this timestamp
   * @param limit Max number of messages to fetch
   * @returns Array of messages
   */
  async getMessagesAfter(token: string, channelId: string, afterTs: string, limit: number = 50): Promise<any[]> {
    try {
      const res = await axios.get('https://slack.com/api/conversations.history', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          channel: channelId,
          oldest: afterTs, // Only messages AFTER this timestamp
          limit: limit,
          inclusive: false // Don't include the message with the exact timestamp
        }
      });
      if (res.data.ok) {
        // Filter out bot messages and the original question message
        const messages = res.data.messages || [];
        return messages.filter((m: any) => !m.bot_id && m.ts !== afterTs);
      }
      console.warn(`[Slack] Failed to fetch messages after ${afterTs}:`, res.data.error);
      return [];
    } catch (e) {
      console.error(`[Slack] Error fetching messages after ${afterTs}:`, e.message);
      return [];
    }
  }

  async exchangeCode(code: string, redirectUri: string): Promise<any> {
    const clientId = this.config.get('SLACK_CLIENT_ID');
    const clientSecret = this.config.get('SLACK_CLIENT_SECRET');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await axios.post('https://slack.com/api/oauth.v2.access', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.data.ok) {
      throw new Error(response.data.error);
    }
    return response.data;
  }

  async syncData(userId: string, tokens: any): Promise<SyncResult> {
    const teamMembers = [];
    const channels = [];

    try {
      // Fetch users
      const usersRes = await axios.get('https://slack.com/api/users.list', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (usersRes.data.ok && usersRes.data.members) {
        teamMembers.push(...usersRes.data.members.filter(m => !m.is_bot && !m.deleted));
      }

      // Fetch channels (public channels)
      const channelsRes = await axios.get('https://slack.com/api/conversations.list', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        params: {
          types: 'public_channel,private_channel',
          exclude_archived: true,
          limit: 100
        }
      });

      if (channelsRes.data.ok && channelsRes.data.channels) {
        channels.push(...channelsRes.data.channels);
      }
    } catch (e) {
      console.error('Slack Sync Error', e.message);
    }

    return {
      teamMembers: teamMembers.map(m => ({
        externalId: m.id,
        name: m.real_name || m.name,
        email: m.profile?.email,
        avatarUrl: m.profile?.image_512 || m.profile?.image_192,
        sourcesJson: JSON.stringify(['slack'])
      })),
      // Store channels in a custom field for now
      customData: {
        channels: channels.map(c => ({
          id: c.id,
          name: c.name,
          isPrivate: c.is_private,
          memberCount: c.num_members,
          topic: c.topic?.value,
          purpose: c.purpose?.value
        }))
      }
    };
  }
}
