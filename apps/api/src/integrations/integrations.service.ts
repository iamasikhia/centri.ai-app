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
      github: new GithubProvider(config),
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

  getConnectUrl(providerName: string, userId: string) {
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
    const authUrl = provider.getAuthUrl(redirectUri);

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

        // Save Tasks/Todos (Optional, if provider returns them)
        // ...

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
}
