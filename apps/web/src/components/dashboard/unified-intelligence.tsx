'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Brain, MessageSquare, GitBranch, Users, CheckCircle2,
    AlertTriangle, RefreshCw, Sparkles, Mic, GitMerge, GitPullRequest,
    TrendingUp, Calendar, Activity, GitCommit
} from "lucide-react";

interface MomentumData {
    meetingsCompleted: number;
    prsMerged: number;
    tasksCompleted: number;
    reviewsPending: number;
    cycleTimeHours?: number;
}

interface UnifiedIntelligenceData {
    timestamp: string;
    summary: {
        meetingsThisWeek: number;
        decisionsCount: number;
        teamResponsesCount: number;
        blockersCount?: number;
        commitsCount?: number;
        mergedPrsCount?: number;
        activeReposCount?: number;
        contributorsCount?: number;
        githubActivity: any;
        crossReferenceCount: number;
    };
    decisions: Array<{ text: string; meeting: string; date: string }>;
    teamPulse: Array<{ question: string; responses: Array<{ user: string; text: string; time: string }> }>;
    githubSummary: { weeklyBrief: string; initiatives: any[]; metrics: any };
    crossReferenceInsights: Array<{ type: string; icon: string; message: string; source: string }>;
    realityCheck: any[];
}

interface Props {
    momentumData?: MomentumData;
    selectedRepo?: string;
    showEngineering?: boolean;
}

export default function UnifiedIntelligence({ momentumData, selectedRepo, showEngineering = true }: Props) {
    const [data, setData] = useState<UnifiedIntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Create cache keys based on selected repo to ensure isolation
    const repoKey = selectedRepo && selectedRepo !== 'All' ? selectedRepo : 'all';
    const CACHE_KEY = `work_intelligence_cache_${repoKey}`;
    const CACHE_TIME_KEY = `work_intelligence_cache_time_${repoKey}`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchIntelligence = async (forceRefresh = false) => {
        setError(null);

        // Check cache first for instant display
        if (!forceRefresh && typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(CACHE_KEY);
            const cacheTime = sessionStorage.getItem(CACHE_TIME_KEY);

            if (cached && cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < CACHE_DURATION) {
                    // Use cached data immediately
                    setData(JSON.parse(cached));
                    setLoading(false);

                    // Fetch fresh data in background (stale-while-revalidate)
                    const query = selectedRepo && selectedRepo !== 'All' ? `?repo=${encodeURIComponent(selectedRepo)}` : '';
                    fetch(`${API_URL}/dashboard/intelligence${query}`, {
                        headers: { 'x-user-id': 'default-user-id' }
                    })
                        .then(res => res.ok ? res.json() : null)
                        .then(json => {
                            if (json) {
                                setData(json);
                                sessionStorage.setItem(CACHE_KEY, JSON.stringify(json));
                                sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
                            }
                        })
                        .catch(() => { }); // Silent fail for background refresh
                    return;
                }
            }
        }

        setLoading(true);
        try {
            const query = selectedRepo && selectedRepo !== 'All' ? `?repo=${encodeURIComponent(selectedRepo)}` : '';
            const res = await fetch(`${API_URL}/dashboard/intelligence${query}`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);

                // Cache the result
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(json));
                    sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
                }
            } else {
                setError('Failed to load intelligence data');
            }
        } catch (e) {
            console.error('Error fetching unified intelligence:', e);
            setError('Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntelligence();
    }, [selectedRepo]);


    if (loading) {
        return (
            <Card className="overflow-hidden border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-indigo-500 animate-pulse" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Analyzing your work data...</p>
                            <p className="text-xs text-muted-foreground/60">Pulling from meetings, tasks & integrations</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }




    return (
        <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-0">
                {/* Main Stats Grid - key metrics */}
                <div className={`grid ${showEngineering ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-px bg-border/50`}>
                    {/* Momentum Stats */}
                    <StatCell
                        icon={<Mic className="w-4 h-4 text-blue-500" />}
                        label="Meetings"
                        value={momentumData?.meetingsCompleted ?? data?.summary.meetingsThisWeek ?? 0}
                        source="Calendar"
                    />
                    <StatCell
                        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        label="Tasks Done"
                        value={momentumData?.tasksCompleted ?? 0}
                        source="Internal"
                    />
                    {showEngineering && (
                        <>
                            <StatCell
                                icon={<GitCommit className="w-4 h-4 text-purple-500" />}
                                label="Commits"
                                value={data?.summary.commitsCount ?? 0}
                                source="GitHub"
                            />
                            <StatCell
                                icon={<GitMerge className="w-4 h-4 text-indigo-500" />}
                                label="PRs Merged"
                                value={data?.summary.mergedPrsCount ?? 0}
                                source="GitHub"
                            />
                        </>
                    )}
                </div>




            </CardContent>
        </Card>
    );
}

// Individual stat cell component
function StatCell({
    icon,
    label,
    value,
    source,
    highlight = false
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    source: string;
    highlight?: boolean;
}) {
    return (
        <div className={`bg-card p-4 ${highlight ? 'bg-gradient-to-br from-primary/5 to-transparent' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {label}
                </span>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-xs text-muted-foreground/70">{source}</div>
        </div>
    );
}
