'use client';

import { MetricExplanationModal } from '@/components/dashboard/metric-explanation-modal';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecommendedActionsSidebar } from '@/components/dashboard/recommended-actions-sidebar';
import { AddTaskModal } from '@/components/dashboard/add-task-modal';
import { ReportGenerationModal } from '@/components/dashboard/report-generation-modal';
import { MetricDetailsSidebar } from '@/components/dashboard/metric-details-sidebar';
import { Task } from '@/lib/dashboard-utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { NativeSelect } from '@/components/ui/native-select';
import {
    RefreshCw, AlertCircle, Clock, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Minus, Sparkles,
    Zap, GitMerge, GitPullRequest, Activity, AlertTriangle,
    Github, Layers, Mic, Calendar, FileText, Users, MessageSquare
} from 'lucide-react';
import { buildDashboardViewModel, DashboardViewModel, DetailedMetric, ProductFeature, RiskItem, calculateExecutionMomentum } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { RepositoryContextBanner } from '@/components/dashboard/repository-context-banner';
import { UpcomingCalls } from '@/components/dashboard/upcoming-calls';
import { MeetingPrepCard } from '@/components/dashboard/meeting-prep-card';
import UnifiedIntelligence from '@/components/dashboard/unified-intelligence';
import { OnboardingOverlay } from '@/components/dashboard/onboarding-overlay';
import { useTeamMode } from '@/contexts/team-mode-context';

// --- Components ---

function MetricCard({ metric, onClick }: { metric: DetailedMetric, onClick: () => void }) {
    const SourceIcon = metric.source === 'github' ? Github : (metric.source === 'internal' ? Layers : null);
    const sourceLabel = metric.source === 'github' ? 'Source: GitHub' : 'Source: Internal Tracker';

    // Dynamic gradient based on trend
    const gradientClass = metric.trendDirection === 'up'
        ? 'from-emerald-500/5 to-transparent'
        : metric.trendDirection === 'down'
            ? 'from-red-500/5 to-transparent'
            : 'from-slate-500/5 to-transparent';

    return (
        <Card
            onClick={onClick}
            className={cn(
                "group relative flex flex-col h-full overflow-hidden",
                "hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer",
                "hover:border-primary/40 active:scale-[0.98]",
                "hover:-translate-y-0.5"
            )}
        >
            {/* Subtle gradient overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                gradientClass
            )} />

            <CardContent className="relative p-5 flex flex-col h-full">
                {/* Title & Source with auto-sync indicator */}
                <div className="flex justify-between items-start mb-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground/70 transition-colors">
                        {metric.title}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Auto-sync pulse indicator */}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Auto-syncing" />
                        {SourceIcon && (
                            <span title={sourceLabel} className="cursor-help opacity-40 group-hover:opacity-70 transition-opacity">
                                <SourceIcon className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </div>
                </div>

                {/* Primary Number with animated glow on hover */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl font-bold tracking-tight text-foreground group-hover:text-primary/90 transition-colors">
                        {metric.value}
                    </span>
                    <div className={cn(
                        "flex items-center text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide transition-all",
                        metric.trendDirection === 'up'
                            ? "text-emerald-600/90 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30"
                            : metric.trendDirection === 'down'
                                ? "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50"
                                : "text-muted-foreground bg-muted group-hover:bg-muted/80"
                    )}>
                        {metric.trendDirection === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                        {metric.trendDirection === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {metric.trendDirection === 'flat' && <Minus className="w-3 h-3 mr-1" />}
                        {metric.trendLabel}
                    </div>
                </div>

                {/* Secondary Description */}
                <p className="text-sm text-foreground/70 leading-snug mb-2 flex-grow group-hover:text-foreground/80 transition-colors">
                    {metric.description}
                </p>

                {/* Optional Timestamp Subtext */}
                {metric.subtext && (
                    <div className="text-[10px] text-muted-foreground mt-auto pt-2 border-t font-medium group-hover:text-foreground/60 transition-colors">
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
    const [timeRange, setTimeRange] = useState<string>("week");
    const [selectedMetric, setSelectedMetric] = useState<DetailedMetric | null>(null);
    // New State for Explanation Modal
    const [explanationMetric, setExplanationMetric] = useState<{
        key: 'cycle-time' | 'meeting-load' | 'features-completed';
        title: string;
        value: string | number;
    } | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { hasEngineeringTeam, setHasEngineeringTeam } = useTeamMode();
    const [usesSlack, setUsesSlack] = useState(true); // Default to true, update from localStorage

    // Onboarding State
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default to true to prevent flash

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const completed = localStorage.getItem('onboarding_complete') === 'true';
            setHasCompletedOnboarding(completed);

            // Check Slack preference
            const storedUsesSlack = localStorage.getItem('uses_slack');
            if (storedUsesSlack !== null) {
                setUsesSlack(storedUsesSlack === 'true');
            }
        }
    }, []);

    const displayedMetrics = useMemo(() => {
        if (!viewModel) return [];

        // Filter out 'shipped' (Releases to Users) and 'repo-updates' (Team Activity) metrics
        let baseMetrics = viewModel.executive.metrics.filter(m => m.id !== 'shipped' && m.id !== 'repo-updates');

        // For non-engineering users, filter out engineering-focused metrics and show business metrics
        if (!hasEngineeringTeam) {
            // Remove engineering metrics
            baseMetrics = baseMetrics.filter(m =>
                !['commits', 'prs-merged', 'cycle-time', 'blocked-items', 'features-completed', 'eng-changes', 'repo-activity'].includes(m.id)
            );

            // Add/ensure Meetings metric
            const meetingsMetric = {
                id: 'meetings',
                title: 'Meetings This Week',
                value: viewModel.upcomingMeetings?.length || 0,
                description: 'Scheduled meetings',
                trendLabel: 'Calendar',
                trendDirection: 'up' as const,
                source: 'internal' as const
            };

            // Add/ensure Tasks metric
            const tasksMetric = {
                id: 'tasks',
                title: 'Tasks Completed',
                value: viewModel.momentum?.tasksCompleted || 0,
                description: 'Work items done',
                trendLabel: 'Productivity',
                trendDirection: 'up' as const,
                source: 'internal' as const
            };

            // Check if these metrics already exist, if not add them
            if (!baseMetrics.find(m => m.id === 'meetings')) {
                baseMetrics.unshift(meetingsMetric);
            }
            if (!baseMetrics.find(m => m.id === 'tasks')) {
                baseMetrics.splice(1, 0, tasksMetric);
            }
        }

        return baseMetrics;
    }, [viewModel, hasEngineeringTeam]);

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
        // If user doesn't have an engineering team, show non-engineering focused insights
        if (!hasEngineeringTeam) {
            const meetingsCount = viewModel?.upcomingMeetings?.length || 0;
            const tasksCompleted = viewModel?.momentum?.tasksCompleted || 0;

            let text = `This week, you've completed ${tasksCompleted} recorded task${tasksCompleted !== 1 ? 's' : ''}`;

            if (meetingsCount > 0) {
                text += ` and have ${meetingsCount} upcoming meeting${meetingsCount !== 1 ? 's' : ''}. `;
            } else {
                text += `. No upcoming meetings scheduled. `;
            }

            text += "Stay focused on your priorities and stakeholder engagement.";
            return text;
        }

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

        if (totalActivity === 0) {
            text += " Activity is currently low.";
        } else if (merged.length === 0 && shipped.length === 0) {
            text += " Development is active but no PRs merged yet.";
        } else if (merged.length > 5 || (recentCommits > (selectedRepo === 'All' ? 20 : 5) && merged.length > 2)) {
            text += " Momentum is high.";
        } else if (merged.length > 0 || recentCommits > 0) {
            text += " Momentum is stable.";
        } else {
            text += " Activity has slowed.";
        }

        return text;
    }, [viewModel, selectedRepo, filteredGithubData, hasEngineeringTeam]);

    const derivedMomentum = useMemo(() => {
        if (!viewModel) return null;
        if (selectedRepo === 'All') return viewModel.momentum;

        // For specific repo, use filtered data but keep meetings global as requested
        return calculateExecutionMomentum(filteredGithubData, [], viewModel.meetings || []);
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
    }, [status, timeRange]);

    // Auto-refresh polling commented out
    /*
    useEffect(() => {
        if (status !== 'authenticated') return;

        const interval = setInterval(() => {
            // Only refresh if page is visible
            if (!document.hidden) {
                fetchData();
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [status, timeRange]);
    */

    const fetchData = async (forceRefresh = false) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const cacheKey = `dashboard_cache_${timeRange}`;
        const cacheTimeKey = `dashboard_cache_time_${timeRange}`;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        try {
            // Try to load from cache first (for instant display)
            if (!forceRefresh && typeof window !== 'undefined') {
                const cached = sessionStorage.getItem(cacheKey);
                const cacheTime = sessionStorage.getItem(cacheTimeKey);

                if (cached && cacheTime) {
                    const age = Date.now() - parseInt(cacheTime);
                    if (age < CACHE_DURATION) {
                        // Use cached data immediately
                        const cachedVm = JSON.parse(cached);
                        setViewModel(cachedVm);
                        setLoading(false);

                        // Fetch fresh data in background (stale-while-revalidate)
                        fetch(`${API_URL}/dashboard?range=${timeRange}`, { headers: { 'x-user-id': 'default-user-id' } })
                            .then(res => res.ok ? res.json() : null)
                            .then(rawData => {
                                if (rawData) {
                                    const freshVm = buildDashboardViewModel(rawData);
                                    setViewModel(freshVm);
                                    sessionStorage.setItem(cacheKey, JSON.stringify(freshVm));
                                    sessionStorage.setItem(cacheTimeKey, Date.now().toString());
                                }
                            })
                            .catch(() => { }); // Silent fail for background refresh
                        return;
                    }
                }
            }

            setLoading(true);
            const res = await fetch(`${API_URL}/dashboard?range=${timeRange}`, { headers: { 'x-user-id': 'default-user-id' } });

            // Fallback for mocked FE if network fails or endpoint doesn't return new format
            let vm: DashboardViewModel;
            try {
                if (!res.ok) throw new Error("Fetch failed");
                const rawData = await res.json();
                vm = buildDashboardViewModel(rawData);

                // Cache the result
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(cacheKey, JSON.stringify(vm));
                    sessionStorage.setItem(cacheTimeKey, Date.now().toString());
                }
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
            fetchData(true); // Force refresh, skip cache
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
                    <div className="w-32">
                        <NativeSelect value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </NativeSelect>
                    </div>

                    {/* Repository selector - only show when user has engineering team */}
                    {hasEngineeringTeam && viewModel.githubRepositories && viewModel.githubRepositories.length > 0 && (
                        <div className="w-64">
                            <NativeSelect value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                                <option value="All">All Repositories</option>
                                {viewModel.githubRepositories.map(repo => (
                                    <option key={repo.fullName} value={repo.fullName}>
                                        {repo.fullName} {repo.language ? `• ${repo.language}` : ''} {repo.isPrivate ? '🔒' : ''}
                                    </option>
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
                        {syncing ? 'Syncing...' : `Last synced: ${viewModel.attention?.lastSyncedText || 'Unknown'}`}
                    </button>
                    {/* Report Button - Commented out for now
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 hidden md:flex"
                        onClick={() => setIsReportModalOpen(true)}
                    >
                        <FileText className="w-4 h-4" />
                        Report
                    </Button>
                    */}
                    {/* Engineering Team Toggle */}
                    <button
                        onClick={() => setHasEngineeringTeam(!hasEngineeringTeam)}
                        className={cn(
                            "hidden md:flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200",
                            hasEngineeringTeam
                                ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600 shadow-sm hover:shadow-md"
                                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                        )}
                        title="Toggle engineering team features"
                    >
                        <div className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full transition-colors",
                            hasEngineeringTeam
                                ? "bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                : "bg-muted-foreground/10 text-muted-foreground"
                        )}>
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Engineering Team</span>
                        <div className={cn(
                            "relative w-11 h-6 rounded-full transition-all duration-200 ml-1",
                            hasEngineeringTeam
                                ? "bg-gradient-to-r from-violet-500 to-indigo-500 shadow-inner"
                                : "bg-muted-foreground/20"
                        )}>
                            <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200",
                                hasEngineeringTeam
                                    ? "left-6 shadow-violet-500/30"
                                    : "left-1"
                            )} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Repository Context Banner - Only show when user has engineering team */}
            {hasEngineeringTeam && viewModel.githubRawData && (
                <RepositoryContextBanner
                    repository={selectedRepo}
                    repositoryDetails={viewModel.githubRepositories?.find(r => r.fullName === selectedRepo)}
                    allRepositories={viewModel.githubRepositories}
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600/90 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wide border border-emerald-100 dark:border-emerald-900/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Healthy Progress
                        </span>
                        <span className="h-1 w-1 rounded-full bg-indigo-300 dark:bg-indigo-700" />
                        <span className="text-xs text-muted-foreground font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
                    </div>
                    <p className="text-lg font-medium leading-relaxed text-foreground/90">
                        {currentBrief || viewModel.aiInsight}
                    </p>

                    {/* Data Sources - Clean minimal indicator */}
                    <div className="pt-3 mt-3 border-t border-indigo-200/30 flex flex-wrap items-center gap-4 text-xs font-medium text-indigo-900/60 dark:text-indigo-200/60">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Auto-syncing
                        </span>
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Internal</span>
                        {usesSlack && (
                            <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Slack</span>
                        )}
                        {hasEngineeringTeam && (
                            <span className="flex items-center gap-1.5"><Github className="w-3 h-3" /> GitHub</span>
                        )}
                        <span className="flex items-center gap-1.5"><Mic className="w-3 h-3" /> Meetings</span>
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Calendar</span>
                    </div>
                </div>
            </div>

            {/* Predictive Insight Card - The "Magic" unique insight */}
            {(viewModel.attention?.blockedCount > 0 || viewModel.risks?.length > 0) && (
                <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-400/30 rounded-2xl p-5 shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl" />
                    <div className="relative flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg text-white">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">AI Prediction</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-medium">
                                    Needs Attention
                                </span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">
                                {viewModel.attention?.blockedCount > 0
                                    ? `You have ${viewModel.attention.blockedCount} blocked item${viewModel.attention.blockedCount !== 1 ? 's' : ''} that may delay your timeline by 2-3 days if not addressed this week.`
                                    : viewModel.risks?.[0]?.text || 'Some items need your attention to stay on track.'}
                            </p>
                            <button
                                onClick={() => router.push('/todos')}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                            >
                                View Blocked Items
                                <ArrowUpRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Meeting Prep Card - Priority for PMs */}

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

            {/* Dashboard Grid - Adjusts based on engineering mode */}
            <div className={cn(
                "grid gap-8",
                hasEngineeringTeam ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"
            )}>

                {/* Main Content Area */}
                <div className={cn(
                    "space-y-6",
                    hasEngineeringTeam ? "xl:col-span-2" : "lg:col-span-1"
                )}>
                    {/* Combined Team Intelligence Section - Only show for engineering users */}
                    {hasEngineeringTeam && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-muted-foreground" />
                                Work Intelligence
                            </h2>

                            {/* Pass momentum data to the unified component */}
                            <UnifiedIntelligence
                                momentumData={momentumToDisplay}
                                selectedRepo={selectedRepo}
                                showEngineering={hasEngineeringTeam}
                            />
                        </div>
                    )}

                    {/* Recent Activity - Only show when user has engineering team */}
                    {hasEngineeringTeam && (
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
                    )}

                    {/* Quick Actions - Show when NOT engineering mode */}
                    {!hasEngineeringTeam && (
                        <div className="space-y-4 pt-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-muted-foreground" />
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => router.push('/todos')}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl hover:shadow-md transition-all group text-left"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage Tasks</div>
                                        <div className="text-xs text-muted-foreground">Track and organize work</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600" />
                                </button>

                                <button
                                    onClick={() => router.push('/meetings')}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-800/50 rounded-xl hover:shadow-md transition-all group text-left"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                                        <Mic className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">View Meetings</div>
                                        <div className="text-xs text-muted-foreground">Review insights & notes</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600" />
                                </button>

                                <button
                                    onClick={() => router.push('/stakeholders')}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl hover:shadow-md transition-all group text-left"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Stakeholders</div>
                                        <div className="text-xs text-muted-foreground">Manage relationships</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-600" />
                                </button>

                                <button
                                    onClick={() => router.push('/questions')}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl hover:shadow-md transition-all group text-left"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Team CheckIns</div>
                                        <div className="text-xs text-muted-foreground">Stay connected</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Recent Meetings - Show for non-engineering users */}
                    {!hasEngineeringTeam && viewModel.meetings && viewModel.meetings.length > 0 && (
                        <div className="space-y-4 pt-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Mic className="w-5 h-5 text-muted-foreground" />
                                    Recent Meetings
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push('/meetings')}
                                >
                                    View All
                                    <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            <Card>
                                <CardContent className="p-0 divide-y">
                                    {viewModel.meetings.slice(0, 3).map((meeting, i) => (
                                        <button
                                            key={meeting.id || i}
                                            className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                                            onClick={() => router.push(`/meetings/${meeting.id}`)}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                                                i === 0 ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{meeting.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {meeting.startTime ? format(new Date(meeting.startTime), 'MMM d, h:mm a') : 'Date not set'}
                                                </div>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                    {/* Upcoming Calls */}
                    <div className="space-y-4">
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

                    {/* 6. Engineering Efficiency (Real Data) - Only show when user has engineering team */}
                    {hasEngineeringTeam && (
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


                            </div>
                        </div>
                    )}

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
                blockers={viewModel?.blockers || []} // Pass Blockers
                meetings={viewModel?.meetings || []} // Pass Meetings (for decisions)
                tasks={viewModel?.allTasks || []} // Pass all tasks for In Progress
            />
            {
                explanationMetric && (
                    <MetricExplanationModal
                        isOpen={!!explanationMetric}
                        onClose={() => setExplanationMetric(null)}
                        title={explanationMetric.title}
                        metricKey={explanationMetric.key}
                        value={explanationMetric.value}
                        description="Breakdown of this calculation."
                    />
                )
            }
            <ReportGenerationModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                repository={selectedRepo !== 'All' ? selectedRepo : undefined}
            />

            {/* Onboarding Overlay */}
            {
                !hasCompletedOnboarding && (
                    <OnboardingOverlay
                        onComplete={() => {
                            setHasCompletedOnboarding(true);
                            localStorage.setItem('onboarding_complete', 'true');
                        }}
                        onConnectGithub={async () => {
                            // In real app: Trigger NextAuth GitHub flow or link account
                            await new Promise(r => setTimeout(r, 2000));
                            setSelectedRepo('All');
                        }}
                        onConnectCalendar={async () => {
                            // In real app: Trigger Google Calendar flow
                            await new Promise(r => setTimeout(r, 2000));
                        }}
                    />
                )
            }
        </div >
    );
}
