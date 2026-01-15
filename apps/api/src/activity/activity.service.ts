import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    /**
     * Track a user activity event
     */
    async trackActivity(userId: string, activityType: string, metadata?: any) {
        // Only record one activity per user per hour to avoid spam
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentActivity = await this.prisma.userActivity.findFirst({
            where: {
                userId,
                activityAt: { gte: oneHourAgo }
            }
        });

        if (!recentActivity) {
            await this.prisma.userActivity.create({
                data: {
                    userId,
                    activityType,
                    metadata: metadata || null
                }
            });
        }

        return { success: true };
    }

    /**
     * Get Daily Active Users count (unique users active today)
     */
    async getDailyActiveUsers(): Promise<number> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: {
                activityAt: { gte: startOfDay }
            }
        });

        return result.length;
    }

    /**
     * Get Weekly Active Users count (unique users active in last 7 days)
     */
    async getWeeklyActiveUsers(): Promise<number> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: {
                activityAt: { gte: sevenDaysAgo }
            }
        });

        return result.length;
    }

    /**
     * Get Monthly Active Users count (unique users active in last 30 days)
     */
    async getMonthlyActiveUsers(): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: {
                activityAt: { gte: thirtyDaysAgo }
            }
        });

        return result.length;
    }

    /**
     * Calculate retention rates (Day 1, Day 7, Day 30)
     * Retention = % of users who signed up N days ago and were active after
     */
    async getRetentionMetrics() {
        const [day1, day7, day30] = await Promise.all([
            this.calculateRetention(1),
            this.calculateRetention(7),
            this.calculateRetention(30)
        ]);

        return {
            day1Retention: day1,
            day7Retention: day7,
            day30Retention: day30
        };
    }

    private async calculateRetention(daysAgo: number): Promise<number> {
        // Get users who signed up exactly N days ago (within that day)
        const cohortStart = new Date();
        cohortStart.setDate(cohortStart.getDate() - daysAgo);
        cohortStart.setHours(0, 0, 0, 0);

        const cohortEnd = new Date(cohortStart);
        cohortEnd.setDate(cohortEnd.getDate() + 1);

        const cohortUsers = await this.prisma.user.findMany({
            where: {
                createdAt: {
                    gte: cohortStart,
                    lt: cohortEnd
                }
            },
            select: { id: true }
        });

        if (cohortUsers.length === 0) return 0;

        // Check how many of these users were active after their signup day
        const retainedUsers = await this.prisma.userActivity.findMany({
            where: {
                userId: { in: cohortUsers.map(u => u.id) },
                activityAt: { gte: cohortEnd }
            },
            select: { userId: true },
            distinct: ['userId']
        });

        return Math.round((retainedUsers.length / cohortUsers.length) * 100);
    }

    /**
     * Get feature adoption metrics - which pages/features are used most
     */
    async getFeatureAdoption() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activities = await this.prisma.userActivity.findMany({
            where: {
                activityAt: { gte: thirtyDaysAgo }
            },
            select: { metadata: true, userId: true }
        });

        const pageCounts: Record<string, { visits: number; uniqueUsers: Set<string> }> = {};

        activities.forEach(a => {
            const page = (a.metadata as any)?.page || 'unknown';
            const normalizedPage = this.normalizePagePath(page);

            if (!pageCounts[normalizedPage]) {
                pageCounts[normalizedPage] = { visits: 0, uniqueUsers: new Set() };
            }
            pageCounts[normalizedPage].visits++;
            pageCounts[normalizedPage].uniqueUsers.add(a.userId);
        });

        const totalUsers = await this.prisma.user.count();

        const features = Object.entries(pageCounts)
            .map(([page, data]) => ({
                feature: this.getFeatureName(page),
                page,
                visits: data.visits,
                uniqueUsers: data.uniqueUsers.size,
                adoptionRate: totalUsers > 0 ? Math.round((data.uniqueUsers.size / totalUsers) * 100) : 0
            }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 10);

        return features;
    }

    private normalizePagePath(page: string): string {
        return page.split('?')[0].replace(/\/$/, '') || '/dashboard';
    }

    private getFeatureName(page: string): string {
        const featureMap: Record<string, string> = {
            '/dashboard': 'Dashboard',
            '/meetings': 'Meetings',
            '/questions': 'Check-ins',
            '/team': 'Team Overview',
            '/stakeholders': 'Stakeholders',
            '/codebase-overview': 'Codebase Intelligence',
            '/settings': 'Settings',
            '/settings/integrations': 'Integrations',
            '/updates': 'Updates',
            '/newsletters': 'Newsletters'
        };
        return featureMap[page] || page;
    }

    /**
     * Get activity stats for admin dashboard
     */
    async getActivityStats() {
        const [dau, wau, mau, totalUsers, retention, features] = await Promise.all([
            this.getDailyActiveUsers(),
            this.getWeeklyActiveUsers(),
            this.getMonthlyActiveUsers(),
            this.prisma.user.count(),
            this.getRetentionMetrics(),
            this.getFeatureAdoption()
        ]);

        const dailyTrend = await this.getDailyTrend(7);

        return {
            dau,
            wau,
            mau,
            totalUsers,
            dauPercentage: totalUsers > 0 ? Math.round((dau / totalUsers) * 100 * 10) / 10 : 0,
            wauPercentage: totalUsers > 0 ? Math.round((wau / totalUsers) * 100 * 10) / 10 : 0,
            mauPercentage: totalUsers > 0 ? Math.round((mau / totalUsers) * 100 * 10) / 10 : 0,
            dailyTrend,
            retention,
            featureAdoption: features
        };
    }

    /**
     * Get daily active user count for each of the last N days
     */
    private async getDailyTrend(days: number): Promise<Array<{ date: string; count: number }>> {
        const result: Array<{ date: string; count: number }> = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const uniqueUsers = await this.prisma.userActivity.groupBy({
                by: ['userId'],
                where: {
                    activityAt: {
                        gte: date,
                        lt: nextDate
                    }
                }
            });

            result.push({
                date: date.toISOString().split('T')[0],
                count: uniqueUsers.length
            });
        }

        return result;
    }
}
