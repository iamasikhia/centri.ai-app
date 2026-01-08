import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [IntegrationsModule, ConfigModule],
    controllers: [ChatController],
    providers: [ChatService, PrismaService],
})
export class ChatModule { }
