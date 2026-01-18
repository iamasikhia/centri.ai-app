'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    TrendingUp,
    Calendar,
    BarChart3,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityStats {
    dau: number;
    wau: number;
    mau: number;
    totalUsers: number;
    dauPercentage: number;
    wauPercentage: number;
    mauPercentage: number;
    dailyTrend: Array<{ date: string; count: number }>;
    retention: {
        day1Retention: number;
        day7Retention: number;
        day30Retention: number;
    };
    featureAdoption: Array<{
        feature: string;
        page: string;
        visits: number;
        uniqueUsers: number;
        adoptionRate: number;
    }>;
}

export default function UserInsightsPage() {
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/activity/stats`);
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (e) {
            console.error('Failed to fetch activity stats:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    const getRetentionColor = (value: number) => {
        if (value >= 50) return 'text-green-600';
        if (value >= 25) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getTrendIcon = (current: number, previous: number) => {
        if (current > previous) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
        if (current < previous) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Insights</h1>
                    <p className="text-muted-foreground">Activity, retention, and feature adoption metrics</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Active Users KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Daily Active Users</p>
                                <p className="text-2xl font-bold">{stats?.dau || 0}</p>
                                <p className="text-xs text-muted-foreground">{stats?.dauPercentage || 0}% of total users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Weekly Active Users</p>
                                <p className="text-2xl font-bold">{stats?.wau || 0}</p>
                                <p className="text-xs text-muted-foreground">{stats?.wauPercentage || 0}% of total users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Active Users</p>
                                <p className="text-2xl font-bold">{stats?.mau || 0}</p>
                                <p className="text-xs text-muted-foreground">{stats?.mauPercentage || 0}% of total users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Retention & DAU Trend */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Retention Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            User Retention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Day 1 Retention</p>
                                    <p className="text-xs text-muted-foreground">Users active the day after signup</p>
                                </div>
                                <span className={`text-2xl font-bold ${getRetentionColor(stats?.retention?.day1Retention || 0)}`}>
                                    {stats?.retention?.day1Retention || 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Day 7 Retention</p>
                                    <p className="text-xs text-muted-foreground">Users active after 1 week</p>
                                </div>
                                <span className={`text-2xl font-bold ${getRetentionColor(stats?.retention?.day7Retention || 0)}`}>
                                    {stats?.retention?.day7Retention || 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Day 30 Retention</p>
                                    <p className="text-xs text-muted-foreground">Users active after 1 month</p>
                                </div>
                                <span className={`text-2xl font-bold ${getRetentionColor(stats?.retention?.day30Retention || 0)}`}>
                                    {stats?.retention?.day30Retention || 0}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Activity Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            Daily Active Users (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats?.dailyTrend?.map((day, index) => {
                                const maxCount = Math.max(...(stats?.dailyTrend?.map(d => d.count) || [1]));
                                const width = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                                const prevCount = index > 0 ? stats.dailyTrend[index - 1].count : day.count;

                                return (
                                    <div key={day.date} className="space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">
                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{day.count}</span>
                                                {getTrendIcon(day.count, prevCount)}
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{ width: `${width}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {(!stats?.dailyTrend || stats.dailyTrend.length === 0) && (
                                <p className="text-center text-muted-foreground py-8">No activity data yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feature Adoption */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Feature Adoption (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats?.featureAdoption && stats.featureAdoption.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">Feature</th>
                                        <th className="text-right py-3 px-4 font-semibold">Total Visits</th>
                                        <th className="text-right py-3 px-4 font-semibold">Unique Users</th>
                                        <th className="text-right py-3 px-4 font-semibold">Adoption Rate</th>
                                        <th className="text-left py-3 px-4 font-semibold w-48">Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.featureAdoption.map(feature => (
                                        <tr key={feature.page} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4 font-medium">{feature.feature}</td>
                                            <td className="py-3 px-4 text-right">{feature.visits}</td>
                                            <td className="py-3 px-4 text-right">{feature.uniqueUsers}</td>
                                            <td className="py-3 px-4 text-right font-semibold">{feature.adoptionRate}%</td>
                                            <td className="py-3 px-4">
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${feature.adoptionRate}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No feature usage data yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
