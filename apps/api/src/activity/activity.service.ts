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
     * Get activity stats for admin dashboard
     */
    async getActivityStats() {
        const [dau, wau, mau, totalUsers] = await Promise.all([
            this.getDailyActiveUsers(),
            this.getWeeklyActiveUsers(),
            this.getMonthlyActiveUsers(),
            this.prisma.user.count()
        ]);

        // Get daily trend (last 7 days)
        const dailyTrend = await this.getDailyTrend(7);

        return {
            dau,
            wau,
            mau,
            totalUsers,
            dauPercentage: totalUsers > 0 ? Math.round((dau / totalUsers) * 100 * 10) / 10 : 0,
            wauPercentage: totalUsers > 0 ? Math.round((wau / totalUsers) * 100 * 10) / 10 : 0,
            mauPercentage: totalUsers > 0 ? Math.round((mau / totalUsers) * 100 * 10) / 10 : 0,
            dailyTrend
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
