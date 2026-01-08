import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FundraisingService {
    constructor(private prisma: PrismaService) { }

    async createMany(userId: string, opportunities: any[]) {
        // Ensure user exists to satisfy foreign key constraint
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                console.log(`[Fundraising] User ${userId} not found, creating placeholder.`);
                await this.prisma.user.create({
                    data: {
                        id: userId,
                        email: `user-${userId}@centri.ai`, // Ensure uniqueness
                        name: 'Centri User',
                    }
                });
            }
        } catch (error) {
            console.warn('[Fundraising] User check/create failed:', error);
            // Proceed anyway, maybe it was a race condition and user exists now
        }

        const results = [];
        for (const opp of opportunities) {
            try {
                // Check if duplicate exists
                const existing = await this.prisma.opportunity.findFirst({
                    where: {
                        userId,
                        name: opp.name
                    }
                });

                if (existing) {
                    console.log(`[Fundraising] Skipping duplicate opportunity: ${opp.name}`);
                    continue;
                }

                // Ensure arrays are passed as arrays
                const whatItOffers = Array.isArray(opp.whatItOffers) ? opp.whatItOffers : [];
                const criteria = Array.isArray(opp.criteria) ? opp.criteria : [];
                const stage = Array.isArray(opp.stage) ? opp.stage : [];
                const tags = Array.isArray(opp.tags) ? opp.tags : [];

                const res = await this.prisma.opportunity.create({
                    data: {
                        userId,
                        name: opp.name,
                        programName: opp.programName || '',
                        type: opp.type,
                        amount: opp.amount || '',
                        equity: opp.equity || '',
                        description: opp.description || '',
                        fullDescription: opp.fullDescription || '',
                        logo: opp.logo || '',
                        whatItOffers,
                        criteria,
                        stage,
                        location: opp.location || '',
                        deadline: opp.deadline || '',
                        website: opp.website || '',
                        tags,
                        aiInsight: opp.aiInsight || '',
                        source: opp.source || 'Deep Search'
                    }
                });
                results.push(res);
            } catch (e) {
                console.error(`Failed to save opportunity ${opp.name}`, e);
            }
        }
        return results;
    }

    async findAll(userId: string) {
        return this.prisma.opportunity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
