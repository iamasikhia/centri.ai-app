import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSettingsController } from './chat-settings.controller';
import { ChatSettingsService } from './chat-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
    imports: [IntegrationsModule, ConfigModule, DashboardModule, AnalyticsModule, PrismaModule],
    controllers: [ChatController, ChatSettingsController],
    providers: [ChatService, ChatSettingsService],
    exports: [ChatSettingsService],
})
export class ChatModule { }
