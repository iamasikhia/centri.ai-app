import { Module, forwardRef } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingAnalysisService } from './meeting-analysis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => IntegrationsModule)
    ],
    controllers: [MeetingsController],
    providers: [MeetingsService, MeetingAnalysisService],
    exports: [MeetingAnalysisService],
})
export class MeetingsModule { }
