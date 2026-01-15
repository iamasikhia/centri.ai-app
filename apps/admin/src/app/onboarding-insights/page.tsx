'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, Plug, TrendingUp, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OnboardingStats {
    totalResponses: number;
    recentCompletions: number;
    avgGoalsSelected: number;
    avgIntegrationsSelected: number;
    goalStats: Array<{ id: string; label: string; count: number; percentage: number }>;
    integrationStats: Array<{ id: string; label: string; count: number; percentage: number }>;
}

interface OnboardingResponse {
    id: string;
    userId: string;
    userEmail: string | null;
    selectedGoals: string[];
    selectedGoalLabels: string[];
    selectedIntegrations: string[];
    selectedIntegrationLabels: string[];
    completedAt: string;
}

export default function OnboardingInsightsPage() {
    const [stats, setStats] = useState<OnboardingStats | null>(null);
    const [responses, setResponses] = useState<OnboardingResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, responsesRes] = await Promise.all([
                fetch(`${API_URL}/onboarding/stats`),
                fetch(`${API_URL}/onboarding/responses`)
            ]);

            if (statsRes.ok) {
                setStats(await statsRes.json());
            }
            if (responsesRes.ok) {
                setResponses(await responsesRes.json());
            }
        } catch (e) {
            console.error('Failed to fetch onboarding data:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Onboarding Insights</h1>
                <p className="text-muted-foreground">User onboarding responses and preferences</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Responses</p>
                                <p className="text-2xl font-bold">{stats?.totalResponses || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                                <p className="text-2xl font-bold">{stats?.recentCompletions || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Goals Selected</p>
                                <p className="text-2xl font-bold">{stats?.avgGoalsSelected || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Plug className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Integrations</p>
                                <p className="text-2xl font-bold">{stats?.avgIntegrationsSelected || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Goal & Integration Popularity */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Goals Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            Goal Popularity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.goalStats && stats.goalStats.length > 0 ? (
                            <div className="space-y-3">
                                {stats.goalStats.map(goal => (
                                    <div key={goal.id} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{goal.label}</span>
                                            <span className="text-muted-foreground">{goal.count} ({goal.percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all"
                                                style={{ width: `${goal.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No data yet</p>
                        )}
                    </CardContent>
                </Card>

                {/* Integrations Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plug className="w-5 h-5 text-orange-600" />
                            Integration Interest
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.integrationStats && stats.integrationStats.length > 0 ? (
                            <div className="space-y-3">
                                {stats.integrationStats.map(integration => (
                                    <div key={integration.id} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{integration.label}</span>
                                            <span className="text-muted-foreground">{integration.count} ({integration.percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-500 rounded-full transition-all"
                                                style={{ width: `${integration.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No data yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Responses Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Recent Onboarding Responses
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {responses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">User ID</th>
                                        <th className="text-left py-3 px-4 font-semibold">Goals Selected</th>
                                        <th className="text-left py-3 px-4 font-semibold">Integrations</th>
                                        <th className="text-left py-3 px-4 font-semibold">Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responses.map(response => (
                                        <tr key={response.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                    {response.userId.substring(0, 12)}...
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {response.selectedGoalLabels.map((goal, i) => (
                                                        <span key={i} className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                            {goal}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {response.selectedIntegrationLabels.map((int, i) => (
                                                        <span key={i} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full">
                                                            {int}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {formatDistanceToNow(new Date(response.completedAt), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No onboarding responses yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
