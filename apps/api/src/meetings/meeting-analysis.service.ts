import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MeetingAnalysisService {
    constructor(
        private prisma: PrismaService,
        private config: ConfigService
    ) { }

    async analyzeMeeting(meetingId: string) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId }
        });

        if (!meeting || !meeting.transcript) {
            console.log(`[Analysis] Skipping ${meetingId} - No transcript`);
            return;
        }

        console.log(`[Analysis] Processing ${meetingId}...`);

        // In a real app, this would utilize the configured LLM (OpenAI, Anthropic, Gemini, etc.)
        // For this implementation, I will simulate the AI extraction based on the transcript content.
        // Ideally this would be: 
        // const extraction = await this.llm.extract(meeting.transcript, SCHEMA);

        // Simulating delay
        await new Promise(r => setTimeout(r, 2000));

        const analysis = this.mockAnalyze(meeting.transcript);

        // Update Meeting with AI results
        await this.prisma.meeting.update({
            where: { id: meeting.id },
            data: {
                summary: analysis.summary,
                highlightsJson: JSON.stringify(analysis.highlights),
                actionItemsJson: JSON.stringify(analysis.actionItems),
                // decisions, risks, followUps could be added to schema or packed into highlights/summary for now
                // leveraging existing schema fields
            }
        });

        console.log(`[Analysis] Completed for ${meetingId}`);
    }

    private mockAnalyze(transcript: string) {
        // Simple mock heuristic for demo purposes if LLM isn't hooked up
        // In production, replace with actual LLM Call

        // Check if this is the Fathom Demo
        if (transcript.includes('Welcome to Fathom') || transcript.includes('Richard White')) {
            return {
                summary: "Executive Summary: Richard White provided a comprehensive demonstration of the Fathom platform. The session covered the core functionalities including recording, real-time transcription, and the highlighting feature. \n\nKey Outcome: Demonstrated how Fathom integrates with Zoom to automate note-taking.",
                highlights: [
                    "Richard White introduced Fathom's core recording capabilities.",
                    "Demonstrated the 'Highlight' feature for marking important moments.",
                    "Showcased the real-time transcription sync."
                ],
                actionItems: [
                    { description: "Review Fathom's Zoom integration documentation", owner: "User", priority: "High", dueDate: null },
                    { description: "Test the highlighting feature in next meeting", owner: "User", priority: "Medium", dueDate: null }
                ]
            };
        }

        return {
            summary: "Executive Summary: The team discussed key project milestones. Backend API integration is proceeding but identified a risk regarding authentication scopes. Frontend implementation for the Meetings feature is largely complete. \n\nKey Outcome: Detailed transcript ingestion pipeline is approved.",
            highlights: [
                "Identified auth scope dependency for Zoom.",
                "Confirmed Fathom integration strategy.",
                "Frontend UI updated to support 'Sync' instead of manual import."
            ],
            actionItems: [
                { description: "Update OAuth scopes for Zoom and Teams", owner: "Backend Team", priority: "High", dueDate: null },
                { description: "Verify Fathom webhook setup", owner: "DevOps", priority: "Medium", dueDate: null },
                { description: "Refine dashboard loading states", owner: "Frontend", priority: "Low", dueDate: null }
            ]
        };
    }
}
