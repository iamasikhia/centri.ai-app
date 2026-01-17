import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationRequestService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId?: string;
        userEmail?: string;
        userName?: string;
        integrationIds: string[];
    }) {
        return this.prisma.integrationRequest.create({
            data: {
                userId: data.userId,
                userEmail: data.userEmail,
                userName: data.userName,
                integrationIds: data.integrationIds,
                status: 'pending',
            },
        });
    }

    async findAll(filters?: {
        status?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        const [items, total] = await Promise.all([
            this.prisma.integrationRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
            }),
            this.prisma.integrationRequest.count({ where }),
        ]);

        return { items, total };
    }

    async findOne(id: string) {
        return this.prisma.integrationRequest.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: string, adminNotes?: string) {
        return this.prisma.integrationRequest.update({
            where: { id },
            data: {
                status,
                adminNotes,
                updatedAt: new Date(),
            },
        });
    }

    async getStats() {
        const [total, pending, underReview, planned, completed] = await Promise.all([
            this.prisma.integrationRequest.count(),
            this.prisma.integrationRequest.count({ where: { status: 'pending' } }),
            this.prisma.integrationRequest.count({ where: { status: 'under_review' } }),
            this.prisma.integrationRequest.count({ where: { status: 'planned' } }),
            this.prisma.integrationRequest.count({ where: { status: 'completed' } }),
        ]);

        // Get most requested integrations
        const allRequests = await this.prisma.integrationRequest.findMany({
            select: { integrationIds: true },
        });

        const integrationCounts: Record<string, number> = {};
        allRequests.forEach((req) => {
            req.integrationIds.forEach((id) => {
                integrationCounts[id] = (integrationCounts[id] || 0) + 1;
            });
        });

        // Sort by count
        const topRequested = Object.entries(integrationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));

        return {
            total,
            pending,
            underReview,
            planned,
            completed,
            topRequested,
        };
    }

    async delete(id: string) {
        return this.prisma.integrationRequest.delete({ where: { id } });
    }
}
