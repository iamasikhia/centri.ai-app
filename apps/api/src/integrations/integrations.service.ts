import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import { IProvider } from './providers/provider.interface';
import { GoogleProvider } from './providers/google.provider';
import { JiraProvider } from './providers/jira.provider';
import { SlackProvider } from './providers/slack.provider';
import { ClickUpProvider } from './providers/clickup.provider';
import { GithubProvider } from './providers/github.provider';
import { GmailProvider } from './providers/gmail.provider';
import { GoogleDriveProvider } from './providers/google-drive.provider';
import { GoogleDocsProvider } from './providers/google-docs.provider';
import { GoogleMeetProvider } from './providers/google-meet.provider';
import { ZoomProvider } from './providers/zoom.provider';
import { FathomProvider } from './providers/fathom.provider';
import { NotionProvider } from './providers/notion.provider';
import { GoogleChatProvider } from './providers/google-chat.provider';
import { TeamsProvider } from './providers/teams.provider';
import { MeetingAnalysisService } from '../meetings/meeting-analysis.service';

@Injectable()
export class IntegrationsService {
  private providers: Record<string, IProvider>;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private config: ConfigService,
    private analysisService: MeetingAnalysisService,
  ) {
    this.providers = {
      google: new GoogleProvider(config),
      gmail: new GmailProvider(config),
      jira: new JiraProvider(config),
      slack: new SlackProvider(config),
      github: new GithubProvider(),
      clickup: new ClickUpProvider(config),
      google_drive: new GoogleDriveProvider(config),
      google_docs: new GoogleDocsProvider(config),
      google_meet: new GoogleMeetProvider(config),
      zoom: new ZoomProvider(config),
      fathom: new FathomProvider(config),
      notion: new NotionProvider(config),
      google_chat: new GoogleChatProvider(config),
      microsoft_teams: new TeamsProvider(config),
    };
  }

  async getAllowedProviders() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'integration_config' }
    });
    // Default to true if no config exists
    return (setting?.value as Record<string, boolean>) || {};
  }

  async getConnectUrl(providerName: string, userId: string) {
    const allowed = await this.getAllowedProviders();
    if (allowed[providerName] === false) {
      throw new BadRequestException(`Integration ${providerName} is disabled by the administrator.`);
    }

    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    // In a real app, redirectUri might be dynamic or env based
    // Use Local URL for Google to avoid ngrok dependency if not running
    // Use Base URL (Ngrok) for Slack or others requiring public internet access
    const useLocal = providerName === 'google' || providerName === 'gmail' || providerName === 'github' || providerName === 'google_drive' || providerName === 'google_docs' || providerName === 'google_meet' || providerName === 'zoom' || providerName === 'google_chat' || providerName === 'microsoft_teams';
    const baseUrl = useLocal
      ? (this.config.get('API_LOCAL_URL') || this.config.get('API_BASE_URL') || 'http://localhost:3001')
      : (this.config.get('API_BASE_URL') || 'http://localhost:3001');

    const redirectUri = `${baseUrl}/integrations/${providerName}/callback`;
    let authUrl = provider.getAuthUrl(redirectUri);

    // Append state param with userId to preserve identity through OAuth flow
    // Check if authUrl already has params
    const separator = authUrl.includes('?') ? '&' : '?';
    authUrl = `${authUrl}${separator}state=${encodeURIComponent(userId)}`;

    // Debug logging for Fathom
    if (providerName === 'fathom') {
      console.log('[Fathom Debug] Generated Auth URL:', authUrl);
      console.log('[Fathom Debug] Base URL:', baseUrl);
      console.log('[Fathom Debug] Redirect URI:', redirectUri);
    }

    return { url: authUrl };
  }

  async handleCallback(providerName: string, code: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    const useLocal = providerName === 'google' || providerName === 'gmail' || providerName === 'github' || providerName === 'google_drive' || providerName === 'google_docs' || providerName === 'google_meet' || providerName === 'zoom' || providerName === 'google_chat' || providerName === 'microsoft_teams';
    const baseUrl = useLocal
      ? (this.config.get('API_LOCAL_URL') || this.config.get('API_BASE_URL') || 'http://localhost:3001')
      : (this.config.get('API_BASE_URL') || 'http://localhost:3001');

    const redirectUri = `${baseUrl}/integrations/${providerName}/callback`;

    // Debug logging for Fathom
    if (providerName === 'fathom') {
      console.log('[Fathom Debug] handleCallback called');
      console.log('[Fathom Debug] Code:', code?.substring(0, 20) + '...');
      console.log('[Fathom Debug] Callback Redirect URI:', redirectUri);
      console.log('[Fathom Debug] Base URL:', baseUrl);
    }

    const tokens = await provider.exchangeCode(code, redirectUri);

    // Encrypt sensitive tokens
    // Assuming tokens object has access_token, refresh_token
    const encryptedBlob = this.encryption.encrypt(JSON.stringify(tokens));

    // Ensure User Exists
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'manager@centri.ai', // Default for MVP
        name: 'Manager One',
      }
    });

    await this.prisma.integrations.upsert({
      where: {
        userId_provider: {
          userId,
          provider: providerName,
        }
      },
      update: {
        encryptedBlob,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: providerName,
        encryptedBlob,
      },
    });

    return { success: true };
  }

  async saveTokens(providerName: string, userId: string, tokens: any) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    const encryptedBlob = this.encryption.encrypt(JSON.stringify(tokens));

    // Ensure User Exists
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: 'manager@centri.ai', // Default for MVP
        name: 'Manager One',
      }
    });

    await this.prisma.integrations.upsert({
      where: {
        userId_provider: {
          userId,
          provider: providerName,
        }
      },
      update: {
        encryptedBlob,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: providerName,
        encryptedBlob,
      },
    });

    return { success: true };
  }

  async getIntegrationStatus(userId: string) {
    const connections = await this.prisma.integrations.findMany({
      where: { userId },
      select: { provider: true, updatedAt: true }
    });
    return connections;
  }

  async disconnect(userId: string, providerName: string) {
    await this.prisma.integrations.deleteMany({
      where: { userId, provider: providerName }
    });
    return { success: true };
  }

  getProvider(name: string): IProvider {
    return this.providers[name];
  }

  async getDecryptedToken(userId: string, provider: string): Promise<any> {
    const integration = await this.prisma.integrations.findUnique({
      where: { userId_provider: { userId, provider } }
    });
    if (!integration) return null;
    return JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
  }

  async sync(userId: string) {
    const integrations = await this.prisma.integrations.findMany({
      where: { userId }
    });

    const results = [];

    for (const integration of integrations) {
      const provider = this.providers[integration.provider];
      if (!provider) continue;

      try {
        const tokens = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
        // Refresh token logic could go here if needed

        const data = await provider.syncData(userId, tokens);

        // Save Meetings
        if (data.meetings && data.meetings.length > 0) {
          for (const meeting of data.meetings) {
            // @ts-ignore
            await this.prisma.meeting.upsert({
              where: {
                id: meeting.id // Assuming ID is unique from provider or generated consistently
              },
              update: {
                title: meeting.title,
                startTime: new Date(meeting.startTime),
                endTime: new Date(meeting.endTime),
                summary: meeting.description || meeting.summary, // Support both fields
                transcript: meeting.transcriptUrl || (typeof meeting.transcript === 'string' ? meeting.transcript : null),
                recordingUrl: meeting.recordingUrl,
                videoProvider: integration.provider,
                highlightsJson: meeting.highlights ? JSON.stringify(meeting.highlights) : null,
                actionItemsJson: meeting.actionItems ? JSON.stringify(meeting.actionItems) : null,
                updatedAt: new Date(),
                transcriptJson: meeting.transcriptJson ? JSON.stringify(meeting.transcriptJson) : null,
                processingStatus: meeting.status || 'processed'
              },
              create: {
                id: meeting.id, // Use provider ID if available, otherwise UUID (handled by provider mapping)
                userId,
                calendarEventId: meeting.calendarEventId || meeting.id, // Fallback
                title: meeting.title,
                startTime: new Date(meeting.startTime),
                endTime: new Date(meeting.endTime),
                attendeesJson: JSON.stringify(meeting.participants || []),
                summary: meeting.description || meeting.summary,
                transcript: meeting.transcriptUrl || (typeof meeting.transcript === 'string' ? meeting.transcript : null),
                recordingUrl: meeting.recordingUrl,
                videoProvider: integration.provider,
                highlightsJson: meeting.highlights ? JSON.stringify(meeting.highlights) : null,
                actionItemsJson: meeting.actionItems ? JSON.stringify(meeting.actionItems) : null,
                transcriptJson: meeting.transcriptJson ? JSON.stringify(meeting.transcriptJson) : null,
                processingStatus: meeting.status || 'processed'
              }
            });

            // Trigger AI Analysis if transcript exists
            if ((meeting.transcript || meeting.transcriptJson) && (meeting.status === 'processed' || !meeting.status)) {
              // don't await this to keep sync fast, let it run in background or queue
              this.analysisService.analyzeMeeting(meeting.id).catch(e => console.error("Analysis trigger failed", e));
            }
          }
        }

        // Save Tasks/Todos
        if (data.tasks && data.tasks.length > 0) {
          for (const task of data.tasks) {
            await this.prisma.todo.upsert({
              where: {
                id: task.id
              },
              update: {
                title: task.title,
                description: task.description,
                dueDate: task.endTime, // Use end time as due date
                calendarEventId: task.calendarEventId,
                updatedAt: new Date()
              },
              create: {
                id: task.id,
                userId,
                title: task.title,
                description: task.description,
                dueDate: task.endTime,
                calendarEventId: task.calendarEventId,
                status: 'pending'
              }
            });
          }
        }

        results.push({ provider: integration.provider, status: 'success' });

      } catch (error) {
        console.error(`Sync failed for ${integration.provider}:`, error);
        results.push({ provider: integration.provider, status: 'failed', error: error.message });
      }
    }

    // Record the overall sync run
    await this.prisma.syncRun.create({
      data: {
        userId,
        provider: 'all',
        status: results.some(r => r.status === 'failed') ? 'partial_success' : 'success',
        startedAt: new Date(),
        finishedAt: new Date(),
        error: JSON.stringify(results)
      }
    });

    return { success: true, results };
  }

  async getRecentActivity(userId: string) {
    const integrations = await this.prisma.integrations.findMany({
      where: { userId }
    });

    const activity: any = {
      github: [],
      google_drive: [],
      all: []
    };

    for (const integration of integrations) {
      const provider = this.providers[integration.provider];
      if (provider && 'fetchActivity' in provider) {
        try {
          const tokens = {
            access_token: this.encryption.decrypt(integration.accessToken),
            refresh_token: integration.refreshToken ? this.encryption.decrypt(integration.refreshToken) : undefined,
          };

          let data;
          if (integration.provider === 'github') {
            data = await (provider as any).fetchActivity(tokens.access_token);
          } else {
            data = await (provider as any).fetchActivity(tokens);
          }

          if (integration.provider === 'github') {
            const items = [];
            if (data.prs) items.push(...data.prs.map((i: any) => ({ ...i, typeKey: 'PR' })));
            if (data.issues) items.push(...data.issues.map((i: any) => ({ ...i, typeKey: 'Issue' })));
            if (data.reviews) items.push(...data.reviews.map((i: any) => ({ ...i, typeKey: 'Review' })));

            const standardized = items.map((i: any) => ({
              source: 'github',
              title: `${i.typeKey}: ${i.title}`,
              link: i.url,
              date: i.updated_at || i.created_at,
              status: i.state
            }));

            activity.github.push(...standardized);
            activity.all.push(...standardized);
          } else if (integration.provider === 'google_drive') {
            if (Array.isArray(data)) {
              const items = data.map((f: any) => ({
                source: 'google_drive',
                title: f.name,
                link: f.webViewLink,
                date: f.modifiedTime,
                status: 'modified'
              }));
              activity.google_drive.push(...items);
              activity.all.push(...items);
            }
          }
        } catch (e) {
          console.error(`Failed to fetch activity for ${integration.provider}`, e);
        }
      }
    }

    activity.all.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return activity;
  }
}
