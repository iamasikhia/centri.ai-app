'use client';

import { MetricExplanationModal } from '@/components/dashboard/metric-explanation-modal';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecommendedActionsSidebar } from '@/components/dashboard/recommended-actions-sidebar';
import { AddTaskModal } from '@/components/dashboard/add-task-modal';
import { MetricDetailsSidebar } from '@/components/dashboard/metric-details-sidebar';
import { Task } from '@/lib/dashboard-utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { NativeSelect } from '@/components/ui/native-select';
import {
    RefreshCw, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Minus, Sparkles,
    Zap, GitMerge, GitPullRequest, Activity, AlertTriangle,
    Github, Layers, Mic, Calendar
} from 'lucide-react';
import { buildDashboardViewModel, DashboardViewModel, DetailedMetric, ProductFeature, RiskItem, calculateExecutionMomentum } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { RepositoryContextBanner } from '@/components/dashboard/repository-context-banner';
import { UpcomingCalls } from '@/components/dashboard/upcoming-calls';

// --- Components ---

function MetricCard({ metric, onClick }: { metric: DetailedMetric, onClick: () => void }) {
    const SourceIcon = metric.source === 'github' ? Github : (metric.source === 'internal' ? Layers : null);
    const sourceLabel = metric.source === 'github' ? 'Source: GitHub' : 'Source: Internal Tracker';

    return (
        <Card
            onClick={onClick}
            className="flex flex-col h-full hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50 active:scale-[0.98]"
        >
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

    // Stage mapping to width/color
    const stages = ['Just Started', 'In Development', 'In Testing', 'Ready to Ship'];
    const currentStageIndex = stages.indexOf(feature.stage || 'Just Started');
    const progress = Math.max(5, ((currentStageIndex + 1) / stages.length) * 100);

    return (
        <div className="flex flex-col gap-3 p-4 border rounded-xl hover:bg-muted/30 transition-colors group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    {SourceIcon && <SourceIcon className="w-3.5 h-3.5 text-muted-foreground/50" />}
                    <h3 className="font-semibold text-sm truncate">{feature.name}</h3>
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1",
                        feature.status === 'On Track' ? "bg-emerald-500/10 text-emerald-600" :
                            feature.status === 'At Risk' ? "bg-amber-500/10 text-amber-600" :
                                feature.status === 'Completed' ? "bg-blue-500/10 text-blue-600" :
                                    "bg-red-500/10 text-red-600"
                    )}>
                        {feature.status}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs font-medium block">{feature.stage}</span>
                    {feature.expectedCompletionDate && (
                        <span className="text-[10px] text-muted-foreground">Due {feature.expectedCompletionDate} ({feature.confidenceLevel} conf.)</span>
                    )}
                </div>
            </div>

            {/* Timeline Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden w-full">
                <div
                    className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                        feature.status === 'At Risk' ? "bg-amber-500" :
                            feature.status === 'Blocked' ? "bg-red-500" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* AI Insight */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground/80">
                <Sparkles className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                <p className="line-clamp-2 leading-relaxed">{feature.aiExplanation}</p>
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
    const [selectedMetric, setSelectedMetric] = useState<DetailedMetric | null>(null);
    // New State for Explanation Modal
    const [explanationMetric, setExplanationMetric] = useState<{
        key: 'cycle-time' | 'meeting-load' | 'features-completed';
        title: string;
        value: string | number;
    } | null>(null);

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
    const filteredGithubData = useMemo(() => {
        if (!viewModel?.githubRawData) return { commits: [], prs: [], releases: [] };
        if (selectedRepo === 'All') return viewModel.githubRawData;

        const { commits, prs, releases } = viewModel.githubRawData;
        return {
            commits: commits.filter((c: any) => c.repo === selectedRepo),
            prs: prs.filter((p: any) => p.repo === selectedRepo),
            releases: releases.filter((r: any) => r.repo === selectedRepo)
        };
    }, [viewModel, selectedRepo]);

    // Dynamic Brief
    const currentBrief = useMemo(() => {
        if (!viewModel?.githubRawData) return viewModel?.aiInsight;

        const { commits, prs, releases } = filteredGithubData;

        const merged = prs.filter((p: any) => p.merged && differenceInDays(new Date(), parseISO(p.merged_at)) <= 7);
        const shipped = releases.filter((r: any) => differenceInDays(new Date(), parseISO(r.published_at)) <= 7);
        const reposCount = new Set(commits.map((c: any) => c.repo)).size;

        let text = `This week, engineering merged ${merged.length} pull requests`;
        if (selectedRepo === 'All') text += ` across ${reposCount} repositories`;
        text += `. `;

        if (shipped.length > 0) {
            text += `${shipped.length} release${shipped.length > 1 ? 's' : ''} shipped. `;
        } else {
            text += `No releases shipped. `;
        }

        // Momentum (Precise Heuristic)
        const recentCommits = commits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 3).length;
        const totalActivity = recentCommits + merged.length + shipped.length;

        if (totalActivity === 0) text += " Activity is currently low.";
        else if (recentCommits > (selectedRepo === 'All' ? 10 : 2) || merged.length > 2) text += " Momentum is high.";
        else if (recentCommits > 0 || merged.length > 0) text += " Momentum is stable.";
        else text += " Activity has slowed.";

        return text;
    }, [viewModel, selectedRepo, filteredGithubData]);

    const derivedMomentum = useMemo(() => {
        if (!viewModel) return null;
        if (selectedRepo === 'All') return viewModel.momentum;

        // For specific repo, use filtered data and EMPTY tasks/meetings to scope to repo activity strictly
        return calculateExecutionMomentum(filteredGithubData, [], []);
    }, [viewModel, selectedRepo, filteredGithubData]);

    // Actual usage derivedMomentum for rendering
    const momentumToDisplay = derivedMomentum || (viewModel ? viewModel.momentum : {
        meetingsCompleted: 0,
        prsMerged: 0,
        tasksCompleted: 0,
        reviewsPending: 0,
        cycleTimeHours: 0,
        meetingMakerRatio: 0,
        investmentDistribution: { features: 0, bugs: 0, techDebt: 0 }
    });

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
        <div className="p-6 md:p-8 pt-12 space-y-10 max-w-[1600px] mx-auto pb-20">

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

            {/* Repository Context Banner */}
            {viewModel.githubRawData && (
                <RepositoryContextBanner
                    repository={selectedRepo}
                    githubData={filteredGithubData}
                />
            )}

            {/* 1. AI Insight Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm transition-all hover:shadow-md">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 text-white">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Healthy Progress
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
                        <MetricCard
                            key={metric.id}
                            metric={metric}
                            onClick={() => setSelectedMetric(metric)}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* 3. Team Momentum & Recent Activity (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Team Momentum */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-muted-foreground" />
                            Team Momentum
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MomentumStat
                                label="Meetings This Week"
                                value={momentumToDisplay.meetingsCompleted}
                                icon={Mic}
                                colorClass="text-blue-500"
                                source="Calendar"
                            />
                            <MomentumStat
                                label="PRs Merged"
                                value={momentumToDisplay.prsMerged}
                                icon={GitMerge}
                                colorClass="text-purple-500"
                                source="GitHub"
                            />
                            <MomentumStat
                                label="Tasks Completed"
                                value={momentumToDisplay.tasksCompleted}
                                icon={CheckCircle2}
                                colorClass="text-emerald-500"
                                source="Internal"
                            />
                            <MomentumStat
                                label="Pending Reviews"
                                value={momentumToDisplay.reviewsPending}
                                icon={GitPullRequest}
                                colorClass="text-amber-500"
                                source="GitHub"
                            />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-muted-foreground" />
                                Recent Activity
                                {selectedRepo !== 'All' && (
                                    <span className="text-xs font-normal text-muted-foreground">
                                        in {selectedRepo}
                                    </span>
                                )}
                            </h2>
                        </div>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-medium">Last 7 days</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RecentActivityFeed
                                    githubData={filteredGithubData}
                                    repository={selectedRepo}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 4. Risk & Attention (1/3) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                    </div>

                    {/* 5. Upcoming Calls */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            Upcoming Calls
                        </h2>
                        <Card>
                            <CardContent className="pt-6">
                                <UpcomingCalls meetings={viewModel.upcomingMeetings || []} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* 6. Engineering Efficiency (Real Data) */}
                    <div className="space-y-6 pt-4 border-t">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-muted-foreground" />
                            Engineering Efficiency
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Cycle Time Card */}
                            <div
                                className="p-5 bg-card border rounded-lg hover:shadow-sm transition-all cursor-pointer hover:border-blue-400 group"
                                onClick={() => setExplanationMetric({
                                    key: 'cycle-time',
                                    title: 'Cycle Time',
                                    value: momentumToDisplay.cycleTimeHours ? `${momentumToDisplay.cycleTimeHours}h` : 'N/A'
                                })}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Cycle Time</div>
                                    <Clock className="w-4 h-4 text-muted-foreground/50 group-hover:text-blue-500" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold tracking-tight">
                                        {momentumToDisplay.cycleTimeHours ? `${momentumToDisplay.cycleTimeHours}h` : <span className="text-xl text-muted-foreground font-normal">N/A</span>}
                                    </span>
                                    {momentumToDisplay.cycleTimeHours ? (
                                        <span className="text-xs text-muted-foreground font-medium">avg. to merge</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground/60">Need ~5 merged PRs</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                    Time from PR creation to merge. Lower is better.
                                </div>
                            </div>

                            {/* Maker Time Card */}
                            <div
                                className="p-5 bg-card border rounded-lg hover:shadow-sm transition-all cursor-pointer hover:border-blue-400 group"
                                onClick={() => setExplanationMetric({
                                    key: 'meeting-load',
                                    title: 'Meeting Load',
                                    value: `${momentumToDisplay.meetingMakerRatio || 0}%`
                                })}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 transition-colors">Meeting Load</div>
                                    <Mic className="w-4 h-4 text-muted-foreground/50 group-hover:text-blue-500" />
                                </div>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-3xl font-bold tracking-tight">
                                        {momentumToDisplay.meetingMakerRatio || 0}%
                                    </span>
                                    <span className={cn(
                                        "text-xs font-bold px-1.5 py-0.5 rounded uppercase",
                                        (momentumToDisplay.meetingMakerRatio || 0) > 30 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                    )}>
                                        {(momentumToDisplay.meetingMakerRatio || 0) > 30 ? "High" : "Healthy"}
                                    </span>
                                </div>
                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                                    <div
                                        className={cn("h-full rounded-full",
                                            (momentumToDisplay.meetingMakerRatio || 0) > 30 ? "bg-red-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${momentumToDisplay.meetingMakerRatio || 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    % of work week spent in meetings
                                </div>
                            </div>

                            {/* Investment Profile Card */}
                            <div className="p-5 bg-card border rounded-lg hover:shadow-sm transition-all md:col-span-2 lg:col-span-1 lg:col-start-1 xl:col-span-2 xl:col-start-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Investment Allocation</div>
                                        <div className="text-xs text-muted-foreground/80 mt-1">Where is the team spending their engineering bandwidth?</div>
                                    </div>
                                    <Layers className="w-4 h-4 text-muted-foreground/50" />
                                </div>

                                <div className="flex items-center gap-1 h-2 w-full rounded-full overflow-hidden mb-3">
                                    <div style={{ width: `${momentumToDisplay.investmentDistribution?.features}%` }} className="h-full bg-emerald-500" title="New Features" />
                                    <div style={{ width: `${momentumToDisplay.investmentDistribution?.bugs}%` }} className="h-full bg-amber-500" title="Bugs & Quality" />
                                    <div style={{ width: `${momentumToDisplay.investmentDistribution?.techDebt}%` }} className="h-full bg-slate-400" title="Tech Debt & Maintenance" />
                                </div>

                                <div className="flex justify-between items-center text-xs px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="font-medium text-foreground">Features</span>
                                        <span className="text-muted-foreground">{momentumToDisplay.investmentDistribution?.features || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="font-medium text-foreground">Quality</span>
                                        <span className="text-muted-foreground">{momentumToDisplay.investmentDistribution?.bugs || 0}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        <span className="font-medium text-foreground">Maintenance</span>
                                        <span className="text-muted-foreground">{momentumToDisplay.investmentDistribution?.techDebt || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Sidebar */}
            <RecommendedActionsSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                actions={viewModel.recommendedActions}
            />

            {/* Modals */}
            <MetricDetailsSidebar
                isOpen={!!selectedMetric}
                onClose={() => setSelectedMetric(null)}
                metric={selectedMetric}
                githubData={filteredGithubData}
            />
            {explanationMetric && (
                <MetricExplanationModal
                    isOpen={!!explanationMetric}
                    onClose={() => setExplanationMetric(null)}
                    title={explanationMetric.title}
                    metricKey={explanationMetric.key}
                    value={explanationMetric.value}
                    description="Breakdown of this calculation."
                />
            )}
        </div>
    );
}
