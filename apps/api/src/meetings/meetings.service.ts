import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingAnalysisService } from './meeting-analysis.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class MeetingsService {
    constructor(
        private prisma: PrismaService,
        private analysisService: MeetingAnalysisService,
        @Inject(forwardRef(() => IntegrationsService)) private integrations: IntegrationsService
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

        try {
            await this.analysisService.analyzeMeeting(id);
        } catch (error) {
            console.error("Re-analysis failed:", error);
        }

        return this.prisma.meeting.findUnique({
            where: { id }
        });
    }

    async getMeetingPrep(meetingId: string, userId: string, linkedinUrl?: string) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, userId }
        });
        if (!meeting) throw new Error('Meeting not found');

        const attendees = meeting.attendeesJson ? JSON.parse(meeting.attendeesJson) : [];
        const emails = attendees.map((a: any) => a.email?.toLowerCase()).filter(Boolean);

        // 1. Fetch Related Tasks
        const pendingTasks = await this.prisma.task.findMany({
            where: {
                userId,
                status: { notIn: ['done', 'completed', 'canceled'] },
                assigneeEmail: { in: emails, mode: 'insensitive' }
            },
            take: 5
        });

        // 2. Fetch Active Blockers
        const activeBlockers = await this.prisma.task.findMany({
            where: { userId, isBlocked: true },
            take: 3
        });

        // 3. Last Interaction
        const recentMeetings = await this.prisma.meeting.findMany({
            where: { userId, id: { not: meetingId }, startTime: { lt: meeting.startTime } },
            orderBy: { startTime: 'desc' },
            take: 20,
            select: { id: true, startTime: true, attendeesJson: true, summary: true }
        });
        const lastMeeting = recentMeetings.find(m => {
            const mAttendees = m.attendeesJson ? JSON.parse(m.attendeesJson) : [];
            const mEmails = mAttendees.map((a: any) => a.email?.toLowerCase());
            return emails.some(e => mEmails.includes(e));
        });

        // 3.5 Fetch Integration Activity
        let activityItems: string[] = [];
        try {
            const recents = await this.integrations.getRecentActivity(userId);
            activityItems = recents.all.slice(0, 10).map((item: any) => {
                if (item.source === 'google_drive') return `📝 ${item.title}`;
                if (item.source === 'github') return `🐙 ${item.title}`;
                return item.title;
            });
        } catch (e) {
            console.error("Failed to fetch integration activity", e);
        }

        // 4. Resolve External Data
        let externalData = null;

        // Try URL with AI augmentation
        if (linkedinUrl) {
            try {
                // Parse name from URL as heuristic
                const parts = linkedinUrl.split('/in/');
                const urlParts = parts.length > 1 ? parts[1].split('/')[0] : '';
                const name = urlParts ? urlParts.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'New Contact';
                const cleanName = name.replace(/\d+$/, '').trim();

                // Use AI to generate profile
                const aiProfile = await this.analysisService.generateProfile(cleanName, linkedinUrl);

                if (aiProfile) {
                    externalData = aiProfile;
                } else {
                    // Fallback if AI fails (e.g. no key)
                    externalData = {
                        person: {
                            name: cleanName,
                            role: 'Professional Profile',
                            company: 'External Organization',
                            summary: `Profile linked: ${linkedinUrl}. AI context generation unavailable.`,
                            interests: ['Professional Networking'],
                            conversationStarters: ['Discuss background']
                        },
                        company: { name: 'Unknown', industry: 'Via LinkedIn', recentNews: 'None found' }
                    };
                }
            } catch (e) {
                console.error("AI Profile Gen failed", e);
            }
        }

        // Fallback to DB
        if (!externalData) {
            const stakeholders = await this.prisma.stakeholder.findMany({
                where: { userId, email: { in: emails, mode: 'insensitive' } }
            });

            if (stakeholders.length > 0) {
                const s = stakeholders[0];
                externalData = {
                    person: {
                        name: s.name,
                        role: s.role,
                        company: s.organization,
                        summary: s.notes || 'No notes available.',
                        interests: [],
                        conversationStarters: ['Follow up']
                    },
                    company: { name: s.organization || 'Unknown', industry: 'N/A', recentNews: 'N/A' }
                };
            }
        }

        let suggestedAgenda = [];
        if (pendingTasks.length > 0) suggestedAgenda.push(...pendingTasks.map(t => `Review: ${t.title}`));

        // Add integration items to agenda if not empty
        if (activityItems.length > 0) suggestedAgenda.push(...activityItems);

        if (suggestedAgenda.length === 0) suggestedAgenda.push('Review recent progress', 'Next Steps');
        if (activeBlockers.length > 0) suggestedAgenda.push(...activeBlockers.map(b => `Blocker: ${b.title}`));

        return {
            mode: externalData ? 'external' : 'internal',
            internal: {
                lastInteraction: lastMeeting ? lastMeeting.startTime.toISOString() : null,
                lastSummary: lastMeeting?.summary ? lastMeeting.summary.substring(0, 150) + '...' : null,
                sentiment: 'Neutral',
                pendingTasks: [
                    ...pendingTasks.map(t => t.title),
                    ...activityItems
                ],
                activeBlockers: activeBlockers.map(t => t.title),
                suggestedAgenda
            },
            external: externalData
        };
    }

    async getNextMeetingWithPrep(userId: string) {
        // Find the next upcoming meeting
        const now = new Date();
        const nextMeeting = await this.prisma.meeting.findFirst({
            where: {
                userId,
                startTime: { gte: now }
            },
            orderBy: { startTime: 'asc' }
        });

        if (!nextMeeting) {
            return { meeting: null, briefing: null };
        }

        // Parse attendees
        const attendees = nextMeeting.attendeesJson ? JSON.parse(nextMeeting.attendeesJson) : [];

        // Generate a basic briefing
        const briefing = await this.generateMeetingBriefing(nextMeeting.id, userId);

        return {
            meeting: {
                id: nextMeeting.id,
                title: nextMeeting.title,
                startTime: nextMeeting.startTime.toISOString(),
                endTime: nextMeeting.endTime?.toISOString(),
                participants: attendees.map((a: any) => a.name || a.email || 'Unknown'),
                summary: nextMeeting.summary,
                platform: nextMeeting.videoProvider
            },
            briefing
        };
    }

    async generateMeetingBriefing(meetingId: string, userId: string) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, userId }
        });

        if (!meeting) {
            throw new Error('Meeting not found');
        }

        const attendees = meeting.attendeesJson ? JSON.parse(meeting.attendeesJson) : [];
        const emails = attendees.map((a: any) => a.email?.toLowerCase()).filter(Boolean);

        // Fetch previous meetings with same attendees
        const previousMeetings = await this.prisma.meeting.findMany({
            where: {
                userId,
                id: { not: meetingId },
                startTime: { lt: meeting.startTime }
            },
            orderBy: { startTime: 'desc' },
            take: 10
        });

        // Filter to related meetings
        const relatedMeetings = previousMeetings.filter(m => {
            const mAttendees = m.attendeesJson ? JSON.parse(m.attendeesJson) : [];
            const mEmails = mAttendees.map((a: any) => a.email?.toLowerCase());
            return emails.some(e => mEmails.includes(e));
        });

        // Fetch open action items/tasks
        const openTasks = await this.prisma.task.findMany({
            where: {
                userId,
                status: { notIn: ['done', 'completed', 'canceled'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Fetch blockers
        const blockers = await this.prisma.task.findMany({
            where: { userId, isBlocked: true },
            take: 5
        });

        // Extract decisions from previous meetings
        const previousDecisions: string[] = [];
        for (const m of relatedMeetings.slice(0, 3)) {
            if (m.decisionsJson) {
                try {
                    const decisions = JSON.parse(m.decisionsJson);
                    if (Array.isArray(decisions)) {
                        previousDecisions.push(...decisions.slice(0, 2));
                    }
                } catch (e) { }
            }
        }

        // Use AI to generate a smart briefing
        try {
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const prompt = `You are preparing a PM for an upcoming meeting. Generate a brief, actionable prep summary.

Meeting: ${meeting.title}
Attendees: ${attendees.map((a: any) => a.name || a.email).join(', ')}
Time: ${meeting.startTime.toISOString()}

Previous meetings with these attendees: ${relatedMeetings.length}
${relatedMeetings.slice(0, 2).map(m => `- ${m.title}: ${m.summary?.substring(0, 100) || 'No summary'}`).join('\n')}

Open tasks/action items (${openTasks.length}):
${openTasks.slice(0, 5).map(t => `- ${t.title}${t.assigneeEmail ? ` (@${t.assigneeEmail.split('@')[0]})` : ''}`).join('\n')}

Current blockers (${blockers.length}):
${blockers.map(b => `- ${b.title}`).join('\n') || 'None'}

Previous decisions:
${previousDecisions.slice(0, 3).join('\n') || 'None recorded'}

Generate a JSON response with:
{
  "context": "1-2 sentence context about this meeting and what to expect",
  "previousDecisions": ["decision 1", "decision 2"],
  "openActionItems": [{"item": "action item", "owner": "person name"}],
  "blockers": ["blocker 1"],
  "suggestedTopics": ["topic 1", "topic 2", "topic 3"],
  "prepTimeMinutes": 5,
  "urgency": "low|medium|high"
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 800,
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content);
            }
        } catch (e) {
            console.error('[Meetings] AI briefing generation failed', e);
        }

        // Fallback to basic briefing
        return {
            context: `Upcoming meeting: ${meeting.title} with ${attendees.length} attendees.`,
            previousDecisions: previousDecisions.slice(0, 3),
            openActionItems: openTasks.slice(0, 5).map(t => ({
                item: t.title,
                owner: t.assigneeEmail?.split('@')[0] || 'Unassigned'
            })),
            blockers: blockers.map(b => b.title),
            suggestedTopics: [
                'Review progress since last meeting',
                'Discuss any blockers',
                'Align on next steps'
            ],
            prepTimeMinutes: 5,
            urgency: blockers.length > 0 ? 'high' : 'low'
        };
    }
}
