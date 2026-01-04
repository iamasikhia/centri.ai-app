import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsModule } from './integrations/integrations.module';
import { SyncModule } from './sync/sync.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { PrismaService } from './prisma/prisma.service';
import { EncryptionService } from './encryption/encryption.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        IntegrationsModule,
        SyncModule,
        DashboardModule,
        ChatModule,
    ],
    providers: [PrismaService, EncryptionService],
})
export class AppModule { }
