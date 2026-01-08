import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingAnalysisService } from './meeting-analysis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MeetingsController],
    providers: [MeetingsService, MeetingAnalysisService],
    exports: [MeetingAnalysisService], // Export so IntegrationsService can use it (if we circular dep workaround or move it)
})
export class MeetingsModule { }
