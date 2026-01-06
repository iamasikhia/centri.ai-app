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

@Injectable()
export class IntegrationsService {
  private providers: Record<string, IProvider>;

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private config: ConfigService,
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
    };
  }

  getConnectUrl(providerName: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    // In a real app, redirectUri might be dynamic or env based
    // Use Local URL for Google to avoid ngrok dependency if not running
    // Use Base URL (Ngrok) for Slack or others requiring public internet access
    const useLocal = providerName === 'google' || providerName === 'gmail' || providerName === 'github' || providerName === 'google_drive' || providerName === 'google_docs' || providerName === 'google_meet';
    const baseUrl = useLocal
      ? (this.config.get('API_LOCAL_URL') || this.config.get('API_BASE_URL') || 'http://localhost:3001')
      : (this.config.get('API_BASE_URL') || 'http://localhost:3001');

    const redirectUri = `${baseUrl}/integrations/${providerName}/callback`;
    return { url: provider.getAuthUrl(redirectUri) };
  }

  async handleCallback(providerName: string, code: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    const useLocal = providerName === 'google' || providerName === 'gmail';
    const baseUrl = useLocal
      ? (this.config.get('API_LOCAL_URL') || this.config.get('API_BASE_URL'))
      : this.config.get('API_BASE_URL');

    const redirectUri = `${baseUrl}/integrations/${providerName}/callback`;
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
    // Record the sync run
    await this.prisma.syncRun.create({
      data: {
        userId,
        provider: 'manual',
        status: 'success',
        startedAt: new Date(),
        finishedAt: new Date()
      }
    });
    return { success: true };
  }
}
