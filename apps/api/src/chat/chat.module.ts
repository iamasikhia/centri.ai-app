import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ConfigModule } from '@nestjs/config';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
    imports: [IntegrationsModule, ConfigModule, DashboardModule],
    controllers: [ChatController],
    providers: [ChatService, PrismaService],
})
export class ChatModule { }
