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
        // Ensure user exists
        await this.prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: 'manager@centri.ai',
                name: 'Manager One',
            }
        });

        const meeting = await this.prisma.meeting.create({
            data: {
                title: data.title,
                startTime: new Date(data.date),
                endTime: new Date(new Date(data.date).getTime() + 3600000), // Default 1 hour
                user: { connect: { id: userId } },
                transcript: data.transcript,
                processingStatus: 'processing', // Start as processing
                videoProvider: 'upload',
                calendarEventId: `upload-${Date.now()}`,
                attendeesJson: '[]'
            }
        });

        // Trigger Analysis and Wait
        try {
            await this.analysisService.analyzeMeeting(meeting.id);
        } catch (error) {
            console.error("Analysis failed during creation:", error);
            // We swallow the error so the meeting is still returned, but it might be in 'failed' or 'new' state depending on analysis service
        }

        // Return the updated meeting with analysis results
        return this.prisma.meeting.findUnique({
            where: { id: meeting.id }
        });
    }

    async reanalyze(id: string, userId: string) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id, userId }
        });

        if (!meeting) {
            throw new Error('Meeting not found');
        }

        // Reset status to processing
        await this.prisma.meeting.update({
            where: { id },
            data: { processingStatus: 'processing' }
        });

        // Trigger Analysis
        // We do not await here to allow immediate return, or we can await if user wants instant feedback.
        // Given the UI request "reload AI processing", typically async is better for UX if it takes time, 
        // but for simplicity and consistency with create, let's await it so the user gets the result immediately in the response.
        try {
            await this.analysisService.analyzeMeeting(id);
        } catch (error) {
            console.error("Re-analysis failed:", error);
        }

        return this.prisma.meeting.findUnique({
            where: { id }
        });
    }
}
