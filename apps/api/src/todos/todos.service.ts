import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './todos.controller';
import { google } from 'googleapis';
import { startOfDay, endOfDay, isPast, isToday } from 'date-fns';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class TodosService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
        private config: ConfigService
    ) { }

    private async ensureUser(userId: string) {
        // Ensure the user exists to prevent Foreign Key errors
        try {
            // Optimization: We could check existence first, but upsert is safer for concurrency
            // We use a dummy email if we are creating. If the user already exists, we do nothing.
            // If the ID is 'default-user-id', it fits the seed logic.
            // If it's a real Auth0/NextAuth ID, ideally we have their real email, but here we just need the row to exist.
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                console.log(`[TodosService] Creating missing user: ${userId}`);
                await this.prisma.user.create({
                    data: {
                        id: userId,
                        email: userId === 'default-user-id' ? 'manager@centri.ai' : `${userId}@placeholder.com`,
                        name: 'Auto Created User'
                    }
                });
            }
        } catch (e) {
            console.error('Failed to ensure user exists:', e);
            // Verify if it exists (race condition)
            const exists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!exists) throw e;
        }
    }

    private async getGoogleTokens(userId: string) {
        const integration = await this.prisma.integrations.findUnique({
            where: { userId_provider: { userId, provider: 'google' } },
        });

        if (!integration || !integration.encryptedBlob) {
            return null;
        }

        try {
            const tokensStart = JSON.parse(this.encryption.decrypt(integration.encryptedBlob));
            return tokensStart;
        } catch (e) {
            console.error('Failed to decrypt tokens', e);
            return null;
        }
    }

    private getOAuthClient(tokens: any) {
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret
        );

        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        });

        return oauth2Client;
    }

    async getTodos(userId: string) {
        // We don't ensureUser here because getting empty list is fine if user doesn't exist.
        const todos = await this.prisma.todo.findMany({
            where: { userId },
            orderBy: [
                { status: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' },
            ],
        });

        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        const grouped = {
            dueToday: todos.filter(
                (t) =>
                    t.status !== 'completed' &&
                    t.dueDate &&
                    t.dueDate >= todayStart &&
                    t.dueDate <= todayEnd,
            ),
            overdue: todos.filter(
                (t) =>
                    t.status !== 'completed' &&
                    t.dueDate &&
                    isPast(t.dueDate) &&
                    !isToday(t.dueDate),
            ),
            upcoming: todos.filter(
                (t) =>
                    t.status !== 'completed' &&
                    t.dueDate &&
                    t.dueDate > todayEnd,
            ),
            noDueDate: todos.filter(
                (t) => t.status !== 'completed' && !t.dueDate,
            ),
            completed: todos.filter((t) => t.status === 'completed'),
        };

        return {
            todos,
            grouped,
        };
    }

    async getTodoStats(userId: string) {
        const todos = await this.prisma.todo.findMany({
            where: { userId, status: { not: 'completed' } },
        });

        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);

        const dueToday = todos.filter(
            (t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd,
        ).length;

        const overdue = todos.filter(
            (t) => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate),
        ).length;

        return {
            total: todos.length,
            dueToday,
            overdue,
        };
    }

    async createTodo(userId: string, dto: CreateTodoDto) {
        await this.ensureUser(userId);

        const todo = await this.prisma.todo.create({
            data: {
                userId,
                title: dto.title,
                description: dto.description,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                priority: dto.priority || 'medium',
                status: 'pending',
            },
        });

        // Sync to calendar if requested or if legacy behavior (auto-sync if due date existed previously, but now we want explicit control)
        // User request: "I want to be able to add it", implies choice.
        if (dto.addToCalendar && todo.dueDate) {
            await this.syncTodoToCalendar(userId, todo);
        }

        return todo;
    }

    async updateTodo(userId: string, id: string, dto: UpdateTodoDto) {
        console.log(`[TodosService] Updating todo ${id}:`, dto);
        // ensure user might be needed if they were deleted? Unlikely.

        const todo = await this.prisma.todo.findFirst({
            where: { id, userId },
        });

        if (!todo) {
            throw new Error('Todo not found');
        }

        const updated = await this.prisma.todo.update({
            where: { id },
            data: {
                title: dto.title ?? todo.title,
                description: dto.description ?? todo.description,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : todo.dueDate,
                priority: dto.priority ?? todo.priority,
                status: dto.status ?? todo.status,
                completedAt: dto.status === 'completed' ? new Date() : todo.completedAt,
            },
        });

        if (updated.calendarEventId) {
            await this.updateCalendarTask(userId, updated);
        } else if (updated.dueDate) {
            await this.syncTodoToCalendar(userId, updated);
        }

        return updated;
    }

    async completeTodo(userId: string, id: string) {
        const todo = await this.prisma.todo.findFirst({
            where: { id, userId },
        });

        if (!todo) {
            throw new Error('Todo not found');
        }

        const updated = await this.prisma.todo.update({
            where: { id },
            data: {
                status: 'completed',
                completedAt: new Date(),
            },
        });

        if (updated.calendarEventId) {
            await this.updateCalendarTask(userId, updated);
        }

        return updated;
    }

    async deleteTodo(userId: string, id: string) {
        const todo = await this.prisma.todo.findFirst({
            where: { id, userId },
        });

        if (!todo) {
            throw new Error('Todo not found');
        }

        if (todo.calendarEventId) {
            await this.deleteCalendarTask(userId, todo.calendarEventId);
        }

        await this.prisma.todo.delete({
            where: { id },
        });

        return { success: true };
    }

    private async syncTodoToCalendar(userId: string, todo: any) {
        try {
            const tokens = await this.getGoogleTokens(userId);
            if (!tokens || !tokens.access_token) return;

            const oauth2Client = this.getOAuthClient(tokens);

            // Use Google Tasks API
            const service = google.tasks({ version: 'v1', auth: oauth2Client });

            const requestBody: any = {
                title: todo.title,
                notes: todo.description || '',
            };

            if (todo.dueDate) {
                // Google Tasks expects spec 'YYYY-MM-DDT00:00:00.000Z' for due date
                requestBody.due = new Date(todo.dueDate).toISOString();
            }

            const response = await service.tasks.insert({
                tasklist: '@default',
                requestBody: requestBody,
            });

            await this.prisma.todo.update({
                where: { id: todo.id },
                data: { calendarEventId: response.data.id }, // Storing Task ID in calendarEventId column
            });
        } catch (error) {
            console.error('Failed to sync todo to Google Tasks:', error);
            throw new Error(`Failed to sync to Google Tasks: ${error.message}`);
        }
    }

    private async updateCalendarTask(userId: string, todo: any) {
        try {
            const tokens = await this.getGoogleTokens(userId);
            if (!tokens || !tokens.access_token || !todo.calendarEventId) return;

            const oauth2Client = this.getOAuthClient(tokens);

            const service = google.tasks({ version: 'v1', auth: oauth2Client });

            const requestBody: any = {
                title: todo.title,
                notes: todo.description || '',
                status: todo.status === 'completed' ? 'completed' : 'needsAction',
            };

            if (todo.dueDate) {
                requestBody.due = new Date(todo.dueDate).toISOString();
            }

            // If completing, we also set completed date? API handles logic usually.
            // But status 'completed' is key.

            await service.tasks.patch({
                tasklist: '@default',
                task: todo.calendarEventId,
                requestBody: requestBody,
            });
        } catch (error) {
            console.error('Failed to update Google Task:', error);
        }
    }

    private async deleteCalendarTask(userId: string, taskId: string) {
        try {
            const tokens = await this.getGoogleTokens(userId);
            if (!tokens || !tokens.access_token) return;

            const oauth2Client = this.getOAuthClient(tokens);

            const service = google.tasks({ version: 'v1', auth: oauth2Client });

            await service.tasks.delete({
                tasklist: '@default',
                task: taskId,
            });
        } catch (error) {
            console.error('Failed to delete Google Task:', error);
        }
    }
}
