'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DollarSign,
    TrendingUp,
    UserCheck,
    UserX,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { getRevenueMetrics } from '@/lib/analytics';

interface RevenueMetrics {
    mrr: number;
    arr: number;
    payingUsers: number;
    freeUsers: number;
    newPayingThisMonth: number;
    churnedUsers: number;
    arpu: number;
    subscriptionGrowthRate: number;
    tierBreakdown: {
        free: number;
        pro: number;
        enterprise: number;
    };
    activeSubscriptions: number;
    totalUsers: number;
}

export default function RevenuePage() {
    const [revenue, setRevenue] = useState<RevenueMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const data = await getRevenueMetrics();
            setRevenue(data);
        } catch (e) {
            console.error('Failed to fetch revenue metrics:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!revenue) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Failed to load revenue metrics</p>
                </div>
            </div>
        );
    }

    const conversionRate = revenue.totalUsers > 0
        ? ((revenue.payingUsers / revenue.totalUsers) * 100).toFixed(1)
        : '0';

    const churnRate = revenue.payingUsers > 0
        ? ((revenue.churnedUsers / revenue.payingUsers) * 100).toFixed(1)
        : '0';

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
                    <p className="text-muted-foreground">Monthly and annual recurring revenue insights</p>
                </div>
                <button
                    onClick={fetchRevenue}
                    className="px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm font-medium"
                >
                    Refresh
                </button>
            </div>

            {/* Main Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MRR */}
                <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-primary/20">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">MRR</div>
                        </div>
                        <div className="text-4xl font-bold mb-1">${revenue.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-muted-foreground">Monthly Recurring Revenue</div>
                        {revenue.subscriptionGrowthRate > 0 && (
                            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+{revenue.subscriptionGrowthRate.toFixed(1)}% growth</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ARR */}
                <Card className="relative overflow-hidden border-2 border-green-500/20 bg-gradient-to-br from-green-500/10 via-green-500/5 to-background">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-green-500/20">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">ARR</div>
                        </div>
                        <div className="text-4xl font-bold mb-1">${revenue.arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-muted-foreground">Annual Recurring Revenue</div>
                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                            <span>MRR × 12</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Paying Users */}
                <Card className="relative overflow-hidden border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-background">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-purple-500/20">
                                <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Paying Users</div>
                        </div>
                        <div className="text-4xl font-bold mb-1">{revenue.payingUsers}</div>
                        <div className="text-xs text-muted-foreground">
                            {conversionRate}% of total users
                        </div>
                        {revenue.newPayingThisMonth > 0 && (
                            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+{revenue.newPayingThisMonth} this month</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Free Users */}
                <Card className="relative overflow-hidden border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-orange-500/20">
                                <UserX className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Free Users</div>
                        </div>
                        <div className="text-4xl font-bold mb-1">{revenue.freeUsers}</div>
                        <div className="text-xs text-muted-foreground">
                            {((revenue.freeUsers / revenue.totalUsers) * 100).toFixed(1)}% of total users
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">ARPU</div>
                        <div className="text-2xl font-bold">${revenue.arpu.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Average Revenue Per User</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">New Paying (MoM)</div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{revenue.newPayingThisMonth}</div>
                        <div className="text-xs text-muted-foreground mt-1">New subscriptions this month</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Churned (MoM)</div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{revenue.churnedUsers}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {churnRate}% churn rate
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="text-sm text-muted-foreground mb-2">Active Subscriptions</div>
                        <div className="text-2xl font-bold">{revenue.activeSubscriptions}</div>
                        <div className="text-xs text-muted-foreground mt-1">Currently active</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tier Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Subscription Tier Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                        {Object.entries(revenue.tierBreakdown).map(([tier, count]) => {
                            const percentage = revenue.totalUsers > 0
                                ? ((count / revenue.totalUsers) * 100).toFixed(1)
                                : '0';

                            const tierConfig = {
                                free: {
                                    label: 'Free',
                                    color: 'orange',
                                    bg: 'bg-orange-500/10',
                                    border: 'border-orange-500/20',
                                    text: 'text-orange-600 dark:text-orange-400'
                                },
                                pro: {
                                    label: 'Pro',
                                    color: 'purple',
                                    bg: 'bg-purple-500/10',
                                    border: 'border-purple-500/20',
                                    text: 'text-purple-600 dark:text-purple-400'
                                },
                                enterprise: {
                                    label: 'Enterprise',
                                    color: 'blue',
                                    bg: 'bg-blue-500/10',
                                    border: 'border-blue-500/20',
                                    text: 'text-blue-600 dark:text-blue-400'
                                }
                            };

                            const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free;

                            return (
                                <div
                                    key={tier}
                                    className={`p-6 rounded-xl border-2 ${config.border} ${config.bg}`}
                                >
                                    <div className={`text-3xl font-bold mb-2 ${config.text}`}>
                                        {count}
                                    </div>
                                    <div className="text-lg font-semibold capitalize mb-1">{config.label}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {percentage}% of total users
                                    </div>
                                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${config.bg} rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Growth Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-2">{conversionRate}%</div>
                        <div className="text-sm text-muted-foreground">
                            {revenue.payingUsers} paying users out of {revenue.totalUsers} total users
                        </div>
                        <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${conversionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <div className="text-4xl font-bold">
                                {revenue.subscriptionGrowthRate > 0 ? '+' : ''}
                                {revenue.subscriptionGrowthRate.toFixed(1)}%
                            </div>
                            {revenue.subscriptionGrowthRate > 0 ? (
                                <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Month-over-month subscription growth rate
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

