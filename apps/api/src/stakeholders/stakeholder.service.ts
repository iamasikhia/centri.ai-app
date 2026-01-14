import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StakeholderService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.stakeholder.findMany({
            where: { userId },
            orderBy: { nextReachOutAt: 'asc' }
        });
    }

    async create(userId: string, data: {
        name: string;
        role: string;
        organization?: string;
        email?: string;
        frequencyValue: number;
        frequencyUnit: string;
        notes?: string;
    }) {
        // Calculate next reach out date based on frequency
        const now = new Date();
        let nextReachOutAt = new Date();

        switch (data.frequencyUnit) {
            case 'Days':
                nextReachOutAt.setDate(now.getDate() + data.frequencyValue);
                break;
            case 'Weeks':
                nextReachOutAt.setDate(now.getDate() + (data.frequencyValue * 7));
                break;
            case 'Months':
                nextReachOutAt.setMonth(now.getMonth() + data.frequencyValue);
                break;
            default:
                nextReachOutAt.setDate(now.getDate() + 7);
        }

        return this.prisma.stakeholder.create({
            data: {
                userId,
                name: data.name,
                role: data.role,
                organization: data.organization,
                email: data.email,
                frequencyValue: data.frequencyValue,
                frequencyUnit: data.frequencyUnit,
                notes: data.notes,
                nextReachOutAt
            }
        });
    }

    async update(userId: string, id: string, data: {
        name?: string;
        role?: string;
        organization?: string;
        email?: string;
        frequencyValue?: number;
        frequencyUnit?: string;
        notes?: string;
        lastContactedAt?: Date;
        nextReachOutAt?: Date;
    }) {
        return this.prisma.stakeholder.updateMany({
            where: { id, userId },
            data
        });
    }

    async logContact(userId: string, id: string) {
        const stakeholder = await this.prisma.stakeholder.findFirst({
            where: { id, userId }
        });

        if (!stakeholder) return null;

        const now = new Date();
        let nextReachOutAt = new Date();

        switch (stakeholder.frequencyUnit) {
            case 'Days':
                nextReachOutAt.setDate(now.getDate() + stakeholder.frequencyValue);
                break;
            case 'Weeks':
                nextReachOutAt.setDate(now.getDate() + (stakeholder.frequencyValue * 7));
                break;
            case 'Months':
                nextReachOutAt.setMonth(now.getMonth() + stakeholder.frequencyValue);
                break;
            default:
                nextReachOutAt.setDate(now.getDate() + 7);
        }

        return this.prisma.stakeholder.update({
            where: { id },
            data: {
                lastContactedAt: now,
                nextReachOutAt
            }
        });
    }

    async delete(userId: string, id: string) {
        return this.prisma.stakeholder.deleteMany({
            where: { id, userId }
        });
    }
}
