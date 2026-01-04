import { ConfigService } from '@nestjs/config';
import { IProvider, SyncResult } from './provider.interface';
import axios from 'axios';

export class JiraProvider implements IProvider {
  name = 'jira';

  constructor(private config: ConfigService) { }

  getAuthUrl(redirectUri: string): string {
    const clientId = this.config.get('JIRA_CLIENT_ID');
    const scopes = 'read:jira-work read:jira-user offline_access';
    return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Math.random().toString(36).substring(7)}&response_type=code&prompt=consent`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<any> {
    const clientId = this.config.get('JIRA_CLIENT_ID');
    const clientSecret = this.config.get('JIRA_CLIENT_SECRET');

    const response = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    return response.data;
  }

  async syncData(userId: string, tokens: any): Promise<SyncResult> {
    const tasks = [];
    try {
      // 1. Get Cloud ID
      const cloudIdRes = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      const cloudId = cloudIdRes.data[0]?.id;
      if (cloudId) {
        // 2. Fetch Issues (JQL: assignee = currentUser() AND statusCategory != Done)
        // Simplified query for MVP: Get everything assigned to me
        const jql = 'assignee = currentUser() ORDER BY duedate ASC';
        const issuesRes = await axios.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        if (issuesRes.data.issues) {
          tasks.push(...issuesRes.data.issues);
        }
      }
    } catch (e) {
      console.error('Jira Sync Error', e.message);
    }

    return {
      tasks: tasks.map(t => {
        const isBlocked = t.fields.issuelinks?.some(l => l.type.inward === 'is blocked by'); // Simplified logic
        return {
          externalId: t.id,
          title: t.fields.summary,
          status: t.fields.status?.name,
          assigneeEmail: t.fields.assignee?.emailAddress, // Note: Jira might hide email depending on privacy settings
          dueDate: t.fields.duedate ? new Date(t.fields.duedate).toISOString() : null,
          priority: t.fields.priority?.name,
          isBlocked: isBlocked || false,
          rawJson: JSON.stringify(t)
        };
      })
    };
  }
}
