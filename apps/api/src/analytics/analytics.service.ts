import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getGlobalKPIs() {
        const totalUsers = await this.prisma.user.count();
        const now = new Date();

        // Calculate Growth Rate (This Month vs Last Month)
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const newUsersThisMonth = await this.prisma.user.count({
            where: { createdAt: { gte: startOfThisMonth } }
        });

        const newUsersLastMonth = await this.prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfLastMonth,
                    lt: startOfThisMonth
                }
            }
        });

        // Avoid division by zero
        const growthRate = newUsersLastMonth > 0
            ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
            : (newUsersThisMonth > 0 ? 100 : 0);

        // Real Active Users from UserActivity table
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get DAU (unique users today)
        const dauResult = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: { activityAt: { gte: startOfToday } }
        });
        const dau = dauResult.length;

        // Get WAU (unique users last 7 days)
        const wauResult = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: { activityAt: { gte: sevenDaysAgo } }
        });
        const wau = wauResult.length;

        // Get MAU (unique users last 30 days)
        const mauResult = await this.prisma.userActivity.groupBy({
            by: ['userId'],
            where: { activityAt: { gte: thirtyDaysAgo } }
        });
        const mau = mauResult.length;

        return {
            totalUsers,
            dau,
            mau,
            wau,
            newSignups: newUsersThisMonth,
            activeOrgs: 1,
            activationRate: totalUsers > 0 ? parseFloat(((mau / totalUsers) * 100).toFixed(1)) : 0,
            churnRate: 0, // No subscription data to calculate churn
            growthRates: {
                users: parseFloat(growthRate.toFixed(1)),
                dau: 0,
            }
        };
    }

    async getFeatureUsage() {
        const meetingsProcessed = await this.prisma.meeting.count();
        const chatConversations = await this.prisma.conversation.count();
        const tasksCreated = await this.prisma.todo.count();
        const stakeholdersTracked = await this.prisma.stakeholder.count();

        return {
            meetingsProcessed,
            dashboardViews: 0, // Not tracking views currently
            chatConversations,
            aiInteractions: await this.prisma.chatMessage.count(),
            tasksCreated,
            stakeholdersTracked
        };
    }

    async getIntegrationHealth() {
        // Real Sync Health from SyncRun table
        const totalRuns = await this.prisma.syncRun.count();
        const successRuns = await this.prisma.syncRun.count({ where: { status: 'success' } });
        const failedRuns = await this.prisma.syncRun.count({ where: { status: 'failed' } });

        const successRate = totalRuns > 0 ? (successRuns / totalRuns) * 100 : 100;

        const connections = await this.prisma.integrations.groupBy({
            by: ['provider'],
            _count: { provider: true }
        });

        const breakdown: Record<string, number> = {};
        connections.forEach(c => {
            breakdown[c.provider] = c._count.provider;
        });

        return {
            totalConnections: connections.reduce((acc, curr) => acc + curr._count.provider, 0),
            syncSuccessRate: parseFloat(successRate.toFixed(1)),
            failedSyncs24h: failedRuns,
            breakdown: breakdown
        };
    }

    async getAIIntelligence() {
        const requestCount = await this.prisma.chatMessage.count({ where: { role: 'user' } });
        // Average roughly 500 tokens per full exchange
        const estimatedTokens = requestCount * 500;

        return {
            totalRequests: requestCount,
            totalTokens: estimatedTokens,
            estimatedCost: (estimatedTokens / 1000) * 0.03,
            costPerUser: 0 // Cannot calc without subscription model
        };
    }

    async getSystemReliability() {
        // Real logic: Check if SyncRun has any recent failures to determine status
        const yester = new Date();
        yester.setDate(yester.getDate() - 1);

        const recentFailures = await this.prisma.syncRun.count({
            where: {
                status: 'failed',
                startedAt: { gte: yester }
            }
        });

        // Calculate real error rate from sync runs
        const totalRuns24h = await this.prisma.syncRun.count({
            where: { startedAt: { gte: yester } }
        });
        const errorRate = totalRuns24h > 0 
            ? (recentFailures / totalRuns24h) * 100 
            : 0;

        // Determine pipeline status based on recent sync results
        const recentSuccesses = await this.prisma.syncRun.count({
            where: {
                status: 'success',
                startedAt: { gte: yester }
            }
        });
        const pipelineHealthy = recentSuccesses > 0 || totalRuns24h === 0;
        const status = pipelineHealthy ? 'healthy' : 'degraded';

        return {
            apiUptime: 100, // Self-reporting as up (would need health check service for real calculation)
            apiLatency: 0, // Would need request logging/monitoring to calculate real latency
            errorRate: parseFloat(errorRate.toFixed(2)),
            jobFailures: recentFailures,
            pipelineStatus: {
                ai: status,
                github: status,
                api: status,
                slack: status,
                calendar: status,
                notifications: status
            }
        };
    }

    async getRevenueMetrics() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Get all users with subscription data
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { subscriptionStatus: 'active' },
                    { subscriptionStatus: 'trialing' },
                    { subscriptionStatus: 'past_due' },
                    { subscriptionTier: { not: null } }
                ]
            },
            select: {
                subscriptionStatus: true,
                subscriptionTier: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                stripePriceId: true,
                createdAt: true
            }
        });

        // Pricing tiers (from stripe.service.ts)
        const PRICING_TIERS: Record<string, number> = {
            pro: 29,
            enterprise: 0, // Custom pricing
            free: 0
        };

        // Calculate paying users
        const payingUsers = users.filter(u => 
            u.subscriptionStatus === 'active' || 
            u.subscriptionStatus === 'trialing' ||
            (u.subscriptionTier && u.subscriptionTier !== 'free' && u.subscriptionTier !== null)
        );

        // Calculate free users
        const freeUsers = await this.prisma.user.count({
            where: {
                OR: [
                    { subscriptionTier: 'free' },
                    { subscriptionTier: null },
                    { subscriptionStatus: null }
                ]
            }
        });

        // Calculate MRR (Monthly Recurring Revenue)
        let mrr = 0;
        payingUsers.forEach(user => {
            const tier = user.subscriptionTier || 'free';
            if (tier === 'pro') {
                mrr += PRICING_TIERS.pro;
            } else if (tier === 'enterprise') {
                // Enterprise is custom pricing, estimate average if needed
                // For now, skip or add logic to track enterprise pricing
            }
        });

        // Calculate ARR (Annual Recurring Revenue) = MRR * 12
        const arr = mrr * 12;

        // Calculate new paying customers this month
        const newPayingThisMonth = payingUsers.filter(u => 
            u.subscriptionStartDate && 
            u.subscriptionStartDate >= startOfMonth
        ).length;

        // Calculate churned customers (canceled subscriptions)
        const churnedUsers = await this.prisma.user.count({
            where: {
                subscriptionStatus: 'canceled',
                subscriptionEndDate: {
                    gte: startOfMonth
                }
            }
        });

        // Calculate total revenue (estimated from subscription start dates)
        const activeSubscriptions = users.filter(u => 
            u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing'
        );

        // Calculate average revenue per user (ARPU)
        const arpu = payingUsers.length > 0 ? mrr / payingUsers.length : 0;

        // Calculate subscription growth rate
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const payingUsersLastMonth = await this.prisma.user.count({
            where: {
                subscriptionStartDate: {
                    gte: startOfLastMonth,
                    lt: startOfMonth
                },
                subscriptionTier: { not: 'free' },
                subscriptionStatus: { in: ['active', 'trialing'] }
            }
        });

        const subscriptionGrowthRate = payingUsersLastMonth > 0
            ? ((newPayingThisMonth - payingUsersLastMonth) / payingUsersLastMonth) * 100
            : (newPayingThisMonth > 0 ? 100 : 0);

        // Tier breakdown
        const tierBreakdown: Record<string, number> = {
            free: freeUsers,
            pro: users.filter(u => u.subscriptionTier === 'pro').length,
            enterprise: users.filter(u => u.subscriptionTier === 'enterprise').length
        };

        return {
            mrr: parseFloat(mrr.toFixed(2)),
            arr: parseFloat(arr.toFixed(2)),
            payingUsers: payingUsers.length,
            freeUsers,
            newPayingThisMonth,
            churnedUsers,
            arpu: parseFloat(arpu.toFixed(2)),
            subscriptionGrowthRate: parseFloat(subscriptionGrowthRate.toFixed(1)),
            tierBreakdown,
            activeSubscriptions: activeSubscriptions.length,
            totalUsers: await this.prisma.user.count()
        };
    }
}
