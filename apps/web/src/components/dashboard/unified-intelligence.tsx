'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Brain, MessageSquare, GitBranch, Users, CheckCircle2,
    AlertTriangle, RefreshCw, Sparkles, Mic, GitMerge, GitPullRequest,
    TrendingUp, Calendar, Activity
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
}

export default function UnifiedIntelligence({ momentumData }: Props) {
    const [data, setData] = useState<UnifiedIntelligenceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchIntelligence = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/dashboard/intelligence`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
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
    }, []);

    if (loading) {
        return (
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-card p-4">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-12" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }




    return (
        <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-0">
                {/* Main Stats Grid - 4 key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50">
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
                    <StatCell
                        icon={<GitPullRequest className="w-4 h-4 text-amber-500" />}
                        label="Reviews"
                        value={momentumData?.reviewsPending ?? 0}
                        source="GitHub"
                    />
                    <StatCell
                        icon={<MessageSquare className="w-4 h-4 text-indigo-500" />}
                        label="Decisions"
                        value={data?.summary.decisionsCount ?? 0}
                        source="Meetings"
                    />
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
