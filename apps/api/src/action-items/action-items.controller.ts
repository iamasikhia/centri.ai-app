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
                            // Items could be strings or objects - description is the OpenAI format
                            const title = typeof item === 'string' ? item : item.description || item.item || item.title || item.action;
                            const owner = typeof item === 'object' ? (item.owner || item.assignee || 'Unassigned') : 'Unassigned';
                            const dueDate = typeof item === 'object' ? item.dueDate : null;
                            const status = typeof item === 'object' ? (item.completed === true || item.status === 'completed' || item.status === 'done' ? 'completed' : 'open') : 'open';

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

    @Post(':id/convert-to-task')
    async convertToTask(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string,
        @Body() body: { title: string; owner?: string; priority?: string; meetingId?: string; itemIndex?: number }
    ) {
        if (!userId) throw new UnauthorizedException('User ID required');

        // 1. Create a task from the action item
        const task = await this.prisma.task.create({
            data: {
                userId,
                externalId: `from-meeting-${id}-${Date.now()}`,
                title: body.title,
                status: 'open',
                assigneeEmail: body.owner || null,
                priority: body.priority || 'medium'
            }
        });

        // 2. Mark the action item as completed in the meeting record
        if (body.meetingId !== undefined && body.itemIndex !== undefined) {
            try {
                const meeting = await this.prisma.meeting.findFirst({
                    where: { id: body.meetingId, userId }
                });

                if (meeting && meeting.actionItemsJson) {
                    const items = JSON.parse(meeting.actionItemsJson);
                    if (Array.isArray(items) && items[body.itemIndex]) {
                        // Mark as completed
                        if (typeof items[body.itemIndex] === 'object') {
                            items[body.itemIndex].completed = true;
                            items[body.itemIndex].convertedToTaskId = task.id;
                            items[body.itemIndex].convertedAt = new Date().toISOString();
                        } else {
                            // If it's a string, convert to object
                            items[body.itemIndex] = {
                                description: items[body.itemIndex],
                                completed: true,
                                convertedToTaskId: task.id,
                                convertedAt: new Date().toISOString()
                            };
                        }

                        await this.prisma.meeting.update({
                            where: { id: body.meetingId },
                            data: { actionItemsJson: JSON.stringify(items) }
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to update meeting action item:', e);
            }
        }

        return {
            success: true,
            task: {
                id: `task-${task.id}`,
                title: task.title,
                owner: task.assigneeEmail?.split('@')[0] || 'Unassigned',
                status: 'open',
                priority: task.priority,
                createdAt: task.createdAt.toISOString()
            }
        };
    }

    @Put(':id/dismiss')
    async dismiss(
        @Headers('x-user-id') userId: string,
        @Param('id') id: string,
        @Body() body: { meetingId?: string; itemIndex?: number; reason?: string }
    ) {
        if (!userId) throw new UnauthorizedException('User ID required');

        // Mark the action item as completed/dismissed in the meeting record
        if (body.meetingId !== undefined && body.itemIndex !== undefined) {
            try {
                const meeting = await this.prisma.meeting.findFirst({
                    where: { id: body.meetingId, userId }
                });

                if (meeting && meeting.actionItemsJson) {
                    const items = JSON.parse(meeting.actionItemsJson);
                    if (Array.isArray(items) && items[body.itemIndex]) {
                        // Mark as completed/dismissed
                        if (typeof items[body.itemIndex] === 'object') {
                            items[body.itemIndex].completed = true;
                            items[body.itemIndex].dismissed = true;
                            items[body.itemIndex].dismissedReason = body.reason || 'Marked as done';
                            items[body.itemIndex].dismissedAt = new Date().toISOString();
                        } else {
                            // If it's a string, convert to object
                            items[body.itemIndex] = {
                                description: items[body.itemIndex],
                                completed: true,
                                dismissed: true,
                                dismissedReason: body.reason || 'Marked as done',
                                dismissedAt: new Date().toISOString()
                            };
                        }

                        await this.prisma.meeting.update({
                            where: { id: body.meetingId },
                            data: { actionItemsJson: JSON.stringify(items) }
                        });

                        return { success: true, message: 'Action item dismissed' };
                    }
                }
            } catch (e) {
                console.error('Failed to dismiss action item:', e);
                return { success: false, message: 'Failed to dismiss action item' };
            }
        }

        return { success: false, message: 'Meeting ID and item index required' };
    }
}
