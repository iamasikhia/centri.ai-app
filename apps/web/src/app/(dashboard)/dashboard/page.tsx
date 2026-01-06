
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecommendedActionsSidebar } from '@/components/dashboard/recommended-actions-sidebar';
import { AddTaskModal } from '@/components/dashboard/add-task-modal';
import { Task } from '@/lib/dashboard-utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { NativeSelect } from '@/components/ui/native-select';
import {
    RefreshCw, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Minus, Sparkles,
    Zap, GitMerge, GitPullRequest, Activity, AlertTriangle,
    Github, Layers, Mic
} from 'lucide-react';
import { buildDashboardViewModel, DashboardViewModel, DetailedMetric, ProductFeature, RiskItem } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// --- Components ---

function MetricCard({ metric }: { metric: DetailedMetric }) {
    const SourceIcon = metric.source === 'github' ? Github : (metric.source === 'internal' ? Layers : null);
    const sourceLabel = metric.source === 'github' ? 'Source: GitHub' : 'Source: Internal Tracker';

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Title & Source */}
                <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {metric.title}
                    </div>
                    {SourceIcon && (
                        <span title={sourceLabel} className="cursor-help">
                            <SourceIcon className="w-3.5 h-3.5 text-muted-foreground/40" />
                        </span>
                    )}
                </div>

                {/* Primary Number */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{metric.value}</span>
                    <div className={cn(
                        "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                        metric.trendDirection === 'up' ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            metric.trendDirection === 'down' ? "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400" :
                                "text-muted-foreground bg-muted"
                    )}>
                        {metric.trendDirection === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                        {metric.trendDirection === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {metric.trendDirection === 'flat' && <Minus className="w-3 h-3 mr-1" />}
                        {metric.trendLabel}
                    </div>
                </div>

                {/* Secondary Description */}
                <p className="text-sm text-foreground/80 leading-snug mb-2 flex-grow">
                    {metric.description}
                </p>

                {/* Optional Timestamp Subtext */}
                {metric.subtext && (
                    <div className="text-[10px] text-muted-foreground mt-auto pt-2 border-t font-medium">
                        {metric.subtext}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ProductFeatureRow({ feature }: { feature: ProductFeature }) {
    const SourceIcon = feature.source === 'github' ? Github : (feature.source === 'internal' ? Layers : null);
    const sourceLabel = feature.source === 'github' ? 'Source: GitHub' : 'Source: Internal Tracker';

    return (
        <div className="flex items-start gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    {SourceIcon && (
                        <span title={sourceLabel} className="cursor-help shrink-0">
                            <SourceIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
                        </span>
                    )}
                    <h3 className="font-semibold text-sm truncate">{feature.name}</h3>
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-2",
                        feature.status === 'On Track' ? "bg-emerald-500/10 text-emerald-600" :
                            feature.status === 'At Risk' ? "bg-amber-500/10 text-amber-600" :
                                "bg-red-500/10 text-red-600"
                    )}>
                        {feature.status}
                    </span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                    <div
                        className={cn("h-full rounded-full transition-all",
                            feature.status === 'On Track' ? "bg-emerald-500" :
                                feature.status === 'At Risk' ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${feature.completion}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {feature.aiExplanation}
                </p>
            </div>
            <div className="text-sm font-bold text-muted-foreground tabular-nums">
                {feature.completion}%
            </div>
        </div>
    );
}

function MomentumStat({ label, value, icon: Icon, colorClass, source }: { label: string, value: string | number, icon: any, colorClass?: string, source?: string }) {
    return (
        <div className="flex flex-col p-4 bg-muted/20 border rounded-xl h-full">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Icon className={cn("w-4 h-4", colorClass)} />
                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            {source && (
                <div className="mt-2 text-[10px] text-muted-foreground/60 font-medium flex items-center gap-1">
                    {source}
                </div>
            )}
        </div>
    );
}

function RiskCard({ item }: { item: RiskItem }) {
    const SourceIcon = item.source === 'github' ? Github : (item.source === 'internal' ? Layers : null);
    const sourceLabel = item.source === 'github' ? 'Source: GitHub' : 'Source: Internal Tracker';

    return (
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200 leading-snug">{item.text}</p>
                    {SourceIcon && (
                        <span title={sourceLabel} className="cursor-help shrink-0">
                            <SourceIcon className="w-3.5 h-3.5 text-red-800/40 dark:text-red-200/40" />
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white dark:bg-black/20 rounded text-red-700 dark:text-red-300 uppercase">
                        {item.severity}
                    </span>
                    <span className="text-[10px] text-red-700/70 dark:text-red-300/70 capitalize">
                        {item.type}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [viewModel, setViewModel] = useState<DashboardViewModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<string>("All");

    const displayedMetrics = useMemo(() => {
        if (!viewModel) return [];
        if (selectedRepo === 'All' || !viewModel.githubRawData) return viewModel.executive.metrics;

        const { commits, prs, releases } = viewModel.githubRawData;
        const filteredCommits = commits.filter((c: any) => c.repo === selectedRepo);
        const filteredPRs = prs.filter((p: any) => p.repo === selectedRepo);
        const filteredReleases = releases.filter((r: any) => r.repo === selectedRepo);

        const commitsLast7d = filteredCommits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 7).length;
        const mergedLast7d = filteredPRs.filter((p: any) => p.merged && differenceInDays(new Date(), parseISO(p.merged_at)) <= 7).length;
        const releasesLast7d = filteredReleases.filter((r: any) => differenceInDays(new Date(), parseISO(r.published_at)) <= 7).length;

        return viewModel.executive.metrics.map(m => {
            if (m.id === 'repo-updates') return { ...m, value: commitsLast7d, trendLabel: 'Filtered', subtext: selectedRepo };
            if (m.id === 'eng-changes') return { ...m, value: mergedLast7d, trendLabel: 'Filtered' };
            if (m.id === 'shipped') return { ...m, value: releasesLast7d, trendLabel: 'Filtered' };
            return m;
        });
    }, [viewModel, selectedRepo]);

    // Dynamic Brief
    const currentBrief = useMemo(() => {
        if (!viewModel?.githubRawData) return viewModel?.aiInsight;

        const { commits, prs, releases } = viewModel.githubRawData;
        const isAll = selectedRepo === 'All';
        const fil = (items: any[]) => isAll ? items : items.filter((i: any) => i.repo === selectedRepo);

        const tCommits = fil(commits);
        const tPRs = fil(prs);
        const tReleases = fil(releases);

        const merged = tPRs.filter((p: any) => p.merged && differenceInDays(new Date(), parseISO(p.merged_at)) <= 7);
        const shipped = tReleases.filter((r: any) => differenceInDays(new Date(), parseISO(r.published_at)) <= 7);
        const reposCount = new Set(tCommits.map((c: any) => c.repo)).size;

        let text = `This week, engineering merged ${merged.length} pull requests`;
        if (isAll) text += ` across ${reposCount} repositories`;
        text += `. `;

        if (shipped.length > 0) {
            text += `${shipped.length} release${shipped.length > 1 ? 's' : ''} shipped. `;
        } else {
            text += `No releases shipped. `;
        }

        // Momentum (Simple Heuristic)
        const recentCommits = tCommits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 3).length;
        if (recentCommits > (isAll ? 10 : 2)) text += "Momentum is high.";
        else if (recentCommits > 0) text += "Momentum is stable.";
        else text += "Activity has slowed.";

        return text;
    }, [viewModel, selectedRepo]);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        if (status === 'authenticated') fetchData();
    }, [status]);

    const fetchData = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            setLoading(true);
            // Mock delay
            await new Promise(r => setTimeout(r, 600));
            const res = await fetch(`${API_URL}/dashboard`, { headers: { 'x-user-id': 'default-user-id' } });

            // Fallback for mocked FE if network fails or endpoint doesn't return new format
            let vm: DashboardViewModel;
            try {
                if (!res.ok) throw new Error("Fetch failed");
                const rawData = await res.json();
                vm = buildDashboardViewModel(rawData);
            } catch (e) {
                // Mock fallback
                vm = buildDashboardViewModel({ tasks: [], meetings: [], people: [], lastSyncedAt: new Date().toISOString() });
            }
            setViewModel(vm);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        setSyncing(true);
        try {
            await fetch(`${API_URL}/integrations/sync`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            // Add a small delay for DB propagation if needed, though await should suffice if backend awaits DB write
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setSyncing(false);
            fetchData();
        }
    };

    if (loading || !viewModel) {
        return (
            <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">What is going on today?</h1>
                    <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto">
                    {viewModel.githubRepositories && viewModel.githubRepositories.length > 0 && (
                        <div className="w-48">
                            <NativeSelect value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                                <option value="All">All Repositories</option>
                                {viewModel.githubRepositories.map(repo => (
                                    <option key={repo} value={repo}>{repo}</option>
                                ))}
                            </NativeSelect>
                        </div>
                    )}
                    <button
                        onClick={triggerSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted text-foreground border rounded-md hover:bg-muted/80 transition-colors"
                    >
                        <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
                        {syncing ? 'Syncing...' : `Last synced: ${viewModel.attention.lastSyncedText}`}
                    </button>
                </div>
            </div>

            {/* 1. AI Insight Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 text-white">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 uppercase tracking-wide">
                            Weekly AI Brief
                        </span>
                        <span className="h-1 w-1 rounded-full bg-indigo-300 dark:bg-indigo-700" />
                        <span className="text-xs text-muted-foreground font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
                    </div>
                    <p className="text-lg font-medium leading-relaxed text-foreground/90">
                        {currentBrief || viewModel.aiInsight}
                    </p>
                    <div className="pt-3 mt-3 border-t border-indigo-200/30 flex flex-wrap items-center gap-4 text-xs font-medium text-indigo-900/60 dark:text-indigo-200/60">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Data from: Internal & Slack Check-ins</span>
                        <span className="flex items-center gap-1.5"><Github className="w-3 h-3" /> GitHub Activity</span>
                        <span className="flex items-center gap-1.5"><Mic className="w-3 h-3" /> Meeting Transcripts</span>
                    </div>
                </div>
            </div>

            {/* 2. Executive Metrics (Scrollable on small, Grid on large) */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    Key Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {displayedMetrics.map(metric => (
                        <MetricCard key={metric.id} metric={metric} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* 3. Product Progress (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-muted-foreground" />
                            Product Progress
                        </h2>
                    </div>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">Feature Initiatives</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {viewModel.product.map(f => (
                                <ProductFeatureRow key={f.id} feature={f} />
                            ))}
                        </CardContent>
                    </Card>

                    {/* Execution Momentum (Moved below progress on mobile, left on desktop usually but sticking to grid) */}
                    <div className="space-y-6 pt-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-muted-foreground" />
                            Team Momentum
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MomentumStat
                                label="Tasks Created"
                                value={viewModel.momentum.tasksCreated}
                                icon={CheckCircle2}
                                source="Source: Internal Tracker"
                            />
                            <MomentumStat
                                label="Meetings Done"
                                value={viewModel.momentum.meetingsCompleted}
                                icon={Mic}
                                colorClass="text-blue-500"
                                source="Source: Google Calendar"
                            />
                            <MomentumStat
                                label="Pending Reviews"
                                value={viewModel.momentum.reviewsPending}
                                icon={GitPullRequest}
                                colorClass="text-amber-500"
                                source="Source: GitHub PRs"
                            />
                            <MomentumStat
                                label="PRs Merged"
                                value={viewModel.momentum.prsMerged}
                                icon={GitMerge}
                                colorClass="text-purple-500"
                                source="Source: GitHub"
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Risk & Attention (1/3) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                            Needs Attention
                        </h2>
                        <Button variant="outline" size="sm" onClick={() => setIsSidebarOpen(true)} className="h-8 gap-2 text-xs">
                            <Zap className="w-3 h-3 text-blue-500" />
                            Recommended Actions
                        </Button>
                    </div>

                    {/* Critical Risks */}
                    {viewModel.risks.length > 0 ? (
                        <div className="space-y-3">
                            {viewModel.risks.map(r => (
                                <RiskCard key={r.id} item={r} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            No critical risks detected.
                        </div>
                    )}

                    {/* Upcoming Meetings (Context) */}
                    {viewModel.upcomingMeetings.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Upcoming Meetings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {viewModel.upcomingMeetings.map(m => (
                                    <div key={m.id} className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded bg-muted flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(m.startTime), 'MMM')}</span>
                                            <span className="text-sm font-bold">{format(new Date(m.startTime), 'd')}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">{m.title}</div>
                                            <div className="text-xs text-muted-foreground">{format(new Date(m.startTime), 'h:mm a')}</div>
                                        </div>
                                        {m.sourceUrl && (
                                            <a
                                                href={m.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shrink-0"
                                            >
                                                Join
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

            </div>

            {/* Sidebar */}
            <RecommendedActionsSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                actions={viewModel.recommendedActions}
            />

        </div>
    );
}
