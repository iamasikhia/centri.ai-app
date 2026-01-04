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
      jira: new JiraProvider(config),
      slack: new SlackProvider(config),
      github: new GithubProvider(config),
      clickup: new ClickUpProvider(config),
      // google_chat: new GoogleChatStub...
    };
  }

  getConnectUrl(providerName: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    // In a real app, redirectUri might be dynamic or env based
    const redirectUri = `${this.config.get('API_BASE_URL')}/integrations/${providerName}/callback`;
    return { url: provider.getAuthUrl(redirectUri) };
  }

  async handleCallback(providerName: string, code: string, userId: string) {
    const provider = this.providers[providerName];
    if (!provider) throw new NotFoundException('Provider not found');

    const redirectUri = `${this.config.get('API_BASE_URL')}/integrations/${providerName}/callback`;
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

  // Helper to get provider instance
  getProvider(name: string): IProvider {
    return this.providers[name];
  }
}
