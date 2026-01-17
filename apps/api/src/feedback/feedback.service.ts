import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId?: string;
        userEmail?: string;
        userName?: string;
        type: string;
        message: string;
        page?: string;
        rating?: number;
    }) {
        return this.prisma.feedback.create({
            data: {
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                type: data.type,
                message: data.message,
                page: data.page,
                rating: data.rating,
                status: 'new',
            },
        });
    }

    async findAll(filters?: {
        status?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.type) {
            where.type = filters.type;
        }

        const [items, total] = await Promise.all([
            this.prisma.feedback.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
            }),
            this.prisma.feedback.count({ where }),
        ]);

        return { items, total };
    }

    async findOne(id: string) {
        return this.prisma.feedback.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: string, adminNotes?: string) {
        return this.prisma.feedback.update({
            where: { id },
            data: {
                status,
                adminNotes,
                updatedAt: new Date(),
            },
        });
    }

    async getStats() {
        const [total, newCount, reviewedCount, resolvedCount, byType] = await Promise.all([
            this.prisma.feedback.count(),
            this.prisma.feedback.count({ where: { status: 'new' } }),
            this.prisma.feedback.count({ where: { status: 'reviewed' } }),
            this.prisma.feedback.count({ where: { status: 'resolved' } }),
            this.prisma.feedback.groupBy({
                by: ['type'],
                _count: true,
            }),
        ]);

        return {
            total,
            new: newCount,
            reviewed: reviewedCount,
            resolved: resolvedCount,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    async delete(id: string) {
        return this.prisma.feedback.delete({ where: { id } });
    }
}
