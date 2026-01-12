import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingAnalysisService } from './meeting-analysis.service';

@Injectable()
export class MeetingsService {
    constructor(
        private prisma: PrismaService,
        private analysisService: MeetingAnalysisService
    ) { }

    async findAll(userId: string) {
        return this.prisma.meeting.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' }
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.meeting.findFirst({
            where: { id, userId }
        });
    }

    async create(userId: string, data: { title: string; date: string; transcript: string }) {
        // Ensure user exists (Mock check or simple upsert logic if needed, but assuming user exists)
        // Note: In real app, we should valid userId format or existence.

        const meeting = await this.prisma.meeting.create({
            data: {
                title: data.title,
                startTime: new Date(data.date),
                endTime: new Date(new Date(data.date).getTime() + 3600000), // Default 1 hour
                user: { connect: { id: userId } }, // Assumes User exists with this ID. If not, this throws.
                transcript: data.transcript,
                processingStatus: 'new',
                videoProvider: 'upload',
                calendarEventId: `upload-${Date.now()}`,
                attendeesJson: '[]'
            }
        });

        // Trigger Analysis
        this.analysisService.analyzeMeeting(meeting.id).catch(e => console.error("Analysis trigger failed", e));

        return meeting;
    }
}
