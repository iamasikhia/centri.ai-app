import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsModule } from './integrations/integrations.module';
import { SyncModule } from './sync/sync.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { UpdatesModule } from './updates/updates.module';
import { TodosModule } from './todos/todos.module';
import { FundraisingModule } from './fundraising/fundraising.module';
import { MeetingsModule } from './meetings/meetings.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionService } from './encryption/encryption.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        PrismaModule,
        IntegrationsModule,
        SyncModule,
        DashboardModule,
        ChatModule,
        UpdatesModule,
        TodosModule,
        FundraisingModule,
        MeetingsModule,
    ],
    providers: [EncryptionService],
})
export class AppModule { }

