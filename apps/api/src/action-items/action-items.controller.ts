import { Controller, Get, Post, Put, Delete, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('action-items')
export class ActionItemsController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async findAll(@Headers('x-user-id') userId: string) {
        if (!userId) throw new UnauthorizedException('User ID required');

        // Gather action items from multiple sources:
        // 1. Extract from meeting actionItemsJson
        // 2. Get open tasks
        const actionItems: any[] = [];

        // From meetings
        const meetings = await this.prisma.meeting.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' },
            take: 20,
            select: {
                id: true,
                title: true,
                actionItemsJson: true,
                startTime: true
            }
        });

        for (const meeting of meetings) {
            if (meeting.actionItemsJson) {
                try {
                    const items = JSON.parse(meeting.actionItemsJson);
                    if (Array.isArray(items)) {
                        items.forEach((item: any, idx: number) => {
                            // Items could be strings or objects
                            const title = typeof item === 'string' ? item : item.item || item.title || item.action;
                            const owner = typeof item === 'object' ? (item.owner || item.assignee || 'Unassigned') : 'Unassigned';
                            const dueDate = typeof item === 'object' ? item.dueDate : null;
                            const status = typeof item === 'object' ? (item.completed ? 'completed' : 'open') : 'open';

                            actionItems.push({
                                id: `meeting-${meeting.id}-${idx}`,
                                title,
                                owner,
                                status,
                                dueDate,
                                source: 'meeting',
                                sourceId: meeting.id,
                                sourceName: meeting.title,
                                createdAt: meeting.startTime.toISOString()
                            });
                        });
                    }
                } catch (e) {
                    // Skip malformed JSON
                }
            }
        }

        // From tasks (that have assignees)
        const tasks = await this.prisma.task.findMany({
            where: {
                userId,
                status: { notIn: ['done', 'completed', 'canceled'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        for (const task of tasks) {
            actionItems.push({
                id: `task-${task.id}`,
                title: task.title,
                owner: task.assigneeEmail?.split('@')[0] || 'Unassigned',
                ownerEmail: task.assigneeEmail,
                status: task.status === 'done' || task.status === 'completed' ? 'completed' : 'open',
                dueDate: task.dueDate?.toISOString(),
                source: 'task',
                sourceId: task.id,
                priority: task.priority === 'high' ? 'high' : task.priority === 'low' ? 'low' : 'medium',
                createdAt: task.createdAt.toISOString()
            });
        }

        // Sort by status (open first) then by due date
        actionItems.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });

        return actionItems;
    }

    @Post()
    async create(
        @Headers('x-user-id') userId: string,
        @Body() body: { title: string; owner?: string; dueDate?: string; priority?: string }
    ) {
        if (!userId) throw new UnauthorizedException('User ID required');

        // Create as a task
        const task = await this.prisma.task.create({
            data: {
                userId,
                externalId: `manual-${Date.now()}`,
                title: body.title,
                status: 'open',
                assigneeEmail: body.owner || null,
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                priority: body.priority || 'medium'
            }
        });

        return {
            id: `task-${task.id}`,
            title: task.title,
            owner: task.assigneeEmail?.split('@')[0] || 'Unassigned',
            status: 'open',
            dueDate: task.dueDate?.toISOString(),
            source: 'manual',
            priority: task.priority,
            createdAt: task.createdAt.toISOString()
        };
    }

    @Put(':id/toggle')
    async toggle(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        if (!userId) throw new UnauthorizedException('User ID required');

        // Handle task-based items
        if (id.startsWith('task-')) {
            const taskId = id.replace('task-', '');
            const task = await this.prisma.task.findFirst({
                where: { id: taskId, userId }
            });

            if (task) {
                const newStatus = task.status === 'completed' ? 'open' : 'completed';
                await this.prisma.task.update({
                    where: { id: taskId },
                    data: { status: newStatus }
                });
                return { success: true, status: newStatus };
            }
        }

        // For meeting-based items, we'd need to update the JSON
        // This is more complex, so we'll skip for now
        return { success: false, message: 'Cannot toggle meeting-based items yet' };
    }
}
