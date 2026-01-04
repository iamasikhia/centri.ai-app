import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, addDays, isPast, isToday } from 'date-fns';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboardData(userId: string) {
        const today = new Date();
        const nextWeek = addDays(today, 7);

        // 1. Last Sync
        const lastSync = await this.prisma.syncRun.findFirst({
            where: { userId, status: 'success' },
            orderBy: { finishedAt: 'desc' }
        });

        // 2. People (Team Members)
        const teamMembers = await this.prisma.teamMember.findMany({
            where: { userId }
        });

        const people = teamMembers.map(tm => ({
            id: tm.id,
            displayName: tm.name,
            email: tm.email,
            avatarUrl: tm.avatarUrl,
            sources: JSON.parse(tm.sourcesJson || '[]')
        }));

        // 3. Meetings (Next 7 days)
        const meetingsRaw = await this.prisma.meeting.findMany({
            where: {
                userId,
                startTime: {
                    gte: startOfDay(today),
                    lte: endOfDay(nextWeek)
                }
            },
            orderBy: { startTime: 'asc' }
        });

        const meetings = meetingsRaw.map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime.toISOString(),
            endTime: m.endTime.toISOString(),
            attendeeEmails: JSON.parse(m.attendeesJson || '[]').map((a: any) => a.email || a),
            sourceUrl: null // Add DB field later
        }));

        // 4. Tasks (All active or recently updated)
        const tasksRaw = await this.prisma.task.findMany({
            where: { userId }
        });

        // Filter for relevant tasks (not old done tasks)
        const activeTasks = tasksRaw.filter(t => t.status !== 'Done' || !isPast(addDays(new Date(t.updatedAt), 1)));

        const tasks = activeTasks.map(t => ({
            id: t.id,
            title: t.title,
            assigneeEmail: t.assigneeEmail,
            status: t.status,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
            priority: t.priority,
            isBlocked: t.isBlocked,
            blockedBy: t.blockedByJson ? JSON.parse(t.blockedByJson) : [],
            updatedAt: t.updatedAt.toISOString(),
            createdAt: t.createdAt.toISOString(),
            // Infer source from externalId or other heuristic if needed, or null
            source: t.externalId.includes('-') ? 'jira' : 'other',
            sourceUrl: null
        }));

        // Legacy support (optional, can remove if frontend fully updated)
        // ...

        return {
            lastSyncedAt: lastSync?.finishedAt?.toISOString() || null,
            people,
            tasks,
            meetings,
            // Keep legacy fields for safety if needed, but simplified
            focusTasks: [],
            blockers: [],
            teamStats: [],
            teamMembers: []
        };
    }
}
