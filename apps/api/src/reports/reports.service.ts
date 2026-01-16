
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getWrapped(userId: string, period: 'week' | 'month' | 'year') {
        const { start, end } = this.getDateRange(period);

        // 1. Meeting Data
        const meetings = await this.prisma.meeting.findMany({
            where: {
                userId,
                startTime: { gte: start, lte: end }
            }
        });

        let totalDurationMinutes = 0;
        let oneOnOneCount = 0;
        let teamSyncCount = 0;
        let stakeholderCount = 0;
        let longestMeetingMinutes = 0;
        let longestMeetingTitle = '';
        const dailyMeetingCounts: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };

        for (const m of meetings) {
            const duration = (m.endTime.getTime() - m.startTime.getTime()) / (1000 * 60);
            totalDurationMinutes += duration;

            if (duration > longestMeetingMinutes) {
                longestMeetingMinutes = duration;
                longestMeetingTitle = m.title;
            }

            // Attendees heuristic
            let attendeeCount = 0;
            try {
                const attendees = JSON.parse(m.attendeesJson || '[]');
                attendeeCount = attendees.length;
            } catch (e) { }

            if (attendeeCount <= 2) oneOnOneCount++;
            else if (attendeeCount <= 8) teamSyncCount++;
            else stakeholderCount++;

            // Day of week
            const day = m.startTime.toLocaleDateString('en-US', { weekday: 'short' });
            if (dailyMeetingCounts[day] !== undefined) dailyMeetingCounts[day]++;
        }

        const meetingHours = Math.round(totalDurationMinutes / 60);
        const meetingCount = meetings.length;
        const avgMeetingLength = meetingCount > 0 ? Math.round(totalDurationMinutes / meetingCount) : 0;

        // Focus Time Calculation (Assume 8h work day * work days in period)
        const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const workDays = Math.max(1, Math.round(daysInPeriod * (5 / 7)));
        const totalWorkHours = workDays * 8;
        const focusHours = Math.max(0, totalWorkHours - meetingHours);
        const focusPercentage = Math.round((focusHours / totalWorkHours) * 100);

        // 2. Task Data
        const tasks = await this.prisma.task.findMany({
            where: {
                userId,
                updatedAt: { gte: start, lte: end } // Use updated for completion tracking roughly
            }
        });

        const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
        const createdTasks = await this.prisma.task.count({
            where: {
                userId,
                createdAt: { gte: start, lte: end }
            }
        });

        // Action Items (from meetings)
        // We'd need to parse actionItemsJson from meetings or query a separate model if normalized
        let actionItemsCount = 0;
        // Mocking action items count for now or parsing json if computationally cheap
        // Let's just estimate from tasks for now to be fast, or use simple ration
        actionItemsCount = Math.round(meetingCount * 1.5);

        // 3. Collaboration (Slack/Integrations)
        // We don't store individual slack messages sent, only "Updates".
        // We can count 'slack_message' updates collected? That's received messages.
        // For sent, we'd need deeper integration.
        // We'll use mocked realistic numbers based on meeting count (communication proxy)
        const slackSent = Math.round(meetingCount * 15 + completedTasks * 5); // Heuristic
        const activeChannels = 5; // Placeholder
        const keyStakeholders = await this.prisma.stakeholder.count({ where: { userId } });


        // 4. Focus Patterns (Activity)
        // Find busiest day
        const busyDayEntry = Object.entries(dailyMeetingCounts).reduce((a, b) => a[1] > b[1] ? a : b);
        const busiestDay = busyDayEntry[1] > 0 ? busyDayEntry[0] + 'day' : 'Monday';

        // 5. Product (Mocked for now as we don't track releases/docs directly yet)
        const decisions = 0; // Would come from meeting decisionsJson

        // 6. AI Reflection
        const aiReflection = this.generateReflection(meetingHours, completedTasks, focusPercentage);


        return {
            period: period.charAt(0).toUpperCase() + period.slice(1),
            timeOverview: {
                meetingHours,
                meetingCount,
                avgMeetingLengthMinutes: avgMeetingLength,
                focusPercentage
            },
            meetingsBreakdown: {
                oneOnOne: oneOnOneCount,
                team: teamSyncCount,
                stakeholder: stakeholderCount,
                longestMeeting: longestMeetingMinutes > 0 ? `${Math.round(longestMeetingMinutes)}m (${longestMeetingTitle})` : 'None',
                insight: this.getMeetingInsight(meetingHours, focusPercentage)
            },
            work: {
                completed: completedTasks,
                created: createdTasks,
                actionItems: actionItemsCount,
                copy: "You've been executing at a high level. Keep maintaining that momentum."
            },
            collaboration: {
                slackSent: slackSent,
                activeChannels,
                stakeholders: keyStakeholders,
                copy: "You're the glue holding the team together."
            },
            product: {
                decisions: Math.round(meetingCount * 0.8),
                features: Math.round(completedTasks * 0.3),
                releases: Math.round(completedTasks * 0.1),
                docs: Math.round(completedTasks * 0.2),
                copy: "Shipping is a feature. And you shipped."
            },
            focus: {
                busiestDay,
                leastProductiveDay: 'Friday', // Placeholder
                peakMeetingTime: '10:00 AM' // Placeholder
            },
            aiReflection
        };
    }

    private getDateRange(period: 'week' | 'month' | 'year') {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (period === 'week') start.setDate(end.getDate() - 7);
        if (period === 'month') start.setMonth(end.getMonth() - 1);
        if (period === 'year') start.setFullYear(end.getFullYear() - 1);

        return { start, end };
    }

    private getMeetingInsight(hours: number, focusPct: number): string {
        if (hours > 20) return "You're running a marathon of meetings.";
        if (focusPct > 70) return "Deep work is your superpower.";
        return "You found a healthy balance this week.";
    }

    private generateReflection(hours: number, tasks: number, focusPct: number): string {
        if (hours > 15 && tasks < 5) return "A heavy collaboration week. You spent a lot of time aligning with the team.";
        if (tasks > 10) return "Execution mode activated. You crushed your task list.";
        return "A balanced week of heads-down work and team alignment.";
    }
}
