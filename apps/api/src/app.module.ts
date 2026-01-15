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
import { AnalyticsModule } from './analytics/analytics.module';
import { StakeholderModule } from './stakeholders/stakeholder.module';
import { ActionItemsModule } from './action-items/action-items.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ActivityModule } from './activity/activity.module';

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
        AnalyticsModule,
        StakeholderModule,
        ActionItemsModule,
        OnboardingModule,
        ActivityModule,
    ],
    providers: [EncryptionService],
})
export class AppModule { }

