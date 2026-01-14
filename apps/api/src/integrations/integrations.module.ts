import { Module, forwardRef } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { SlackController } from './slack.controller';
import { CodebaseController } from './codebase.controller';
import { IntegrationsService } from './integrations.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { MeetingsModule } from '../meetings/meetings.module';

import { CalendarClassificationService } from './calendar-classification.service';

import { GithubIntelligenceService } from './github-intelligence.service';
import { GithubDocsService } from './github-docs.service';
import { CodebaseExplainerService } from './codebase-explainer.service';
import { CodebaseAnalyzerService } from './codebase-analyzer.service';

@Module({
    imports: [ConfigModule, forwardRef(() => MeetingsModule)],
    controllers: [IntegrationsController, SlackController, CodebaseController],
    providers: [IntegrationsService, PrismaService, EncryptionService, CalendarClassificationService, GithubIntelligenceService, GithubDocsService, CodebaseExplainerService, CodebaseAnalyzerService],
    exports: [IntegrationsService, CalendarClassificationService, GithubIntelligenceService, GithubDocsService, CodebaseExplainerService, CodebaseAnalyzerService],
})
export class IntegrationsModule { }
