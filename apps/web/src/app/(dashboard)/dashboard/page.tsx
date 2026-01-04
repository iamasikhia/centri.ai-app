'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, formatDistanceToNow, addMinutes } from 'date-fns';
import { RefreshCw, AlertCircle, Clock, Calendar, CheckCircle2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { buildDashboardViewModel, DashboardViewModel, formatPerson, Task, Person } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils'; // Assuming this exists

// SVG Icons for no-data states
const EmptyStateIcon = () => (
    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-6 h-6 text-slate-400" />
    </div>
);

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [viewModel, setViewModel] = useState<DashboardViewModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    // Initial Load
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        if (status === 'authenticated') fetchData();
    }, [status]);

    const fetchData = async () => {
        try {
            setError(null);
            if (!viewModel) setLoading(true);

            // Fetch Data
            const res = await fetch('http://localhost:3001/dashboard', {
                headers: { 'x-user-id': 'default-user-id' }
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const rawData = await res.json();
            const vm = buildDashboardViewModel(rawData);
            setViewModel(vm);
        } catch (e) {
            console.error(e);
            setError('Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        try {
            await fetch('http://localhost:3001/sync/all', {
                method: "POST", headers: { 'x-user-id': 'default-user-id' }
            });
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };

    if (status === 'loading' || (loading && !viewModel)) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold">Unable to load dashboard</h2>
                <button onClick={fetchData} className="mt-4 px-4 py-2 bg-primary text-white rounded">Retry</button>
            </div>
        );
    }

    if (!viewModel) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header & Attention Strip */}
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Morning Briefing</h1>
                        <p className="text-muted-foreground">Executive overview for {format(new Date(), 'EEEE, MMMM do')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={triggerSync}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-70"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <span className="text-xs text-muted-foreground">
                            Last synced: {viewModel.attention.lastSyncedText}
                        </span>
                    </div>
                </div>

                {/* A) Manager Attention Strip */}
                <div className="flex flex-wrap gap-3">
                    <AttentionChip label="Blocked Tasks" count={viewModel.attention.blockedCount} highlight={viewModel.attention.blockedCount > 0} />
                    <AttentionChip label="Overdue" count={viewModel.attention.overdueCount} highlight={viewModel.attention.overdueCount > 0} />
                    <AttentionChip label="Due Today" count={viewModel.attention.dueTodayCount} />
                    <AttentionChip label="Meetings Today" count={viewModel.attention.meetingsTodayCount} />
                    {viewModel.attention.nextMeetingInMinutes !== undefined && (
                        <div className="px-3 py-1.5 rounded-full border bg-slate-900 text-white text-xs font-medium flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Next meeting in {viewModel.attention.nextMeetingInMinutes}m
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Focus & Blockers */}
                <div className="lg:col-span-2 space-y-6">

                    {/* C) Today's Focus */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Focus</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {viewModel.focus.overdue.length === 0 &&
                                viewModel.focus.dueToday.length === 0 &&
                                viewModel.focus.dueSoon.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <EmptyStateIcon />
                                        No immediate tasks.
                                    </div>
                                )}

                            <TaskGroup title="Overdue" tasks={viewModel.focus.overdue} badgeColor="red" />
                            <TaskGroup title="Due Today" tasks={viewModel.focus.dueToday} badgeColor="orange" />
                            <TaskGroup title="Due Soon" tasks={viewModel.focus.dueSoon} badgeColor="slate" />
                        </CardContent>
                    </Card>

                    {/* D) Blockers */}
                    <Card className="border-l-4 border-l-red-500 bg-slate-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base text-red-700">
                                <AlertCircle className="w-5 h-5" /> Active Blockers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {viewModel.blockers.length === 0 ? (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    No blockers 🎉
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {viewModel.blockers.map(t => (
                                        <div key={t.id} className="bg-white p-3 rounded border shadow-sm flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-sm text-slate-900">{t.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <PersonBadge email={t.assigneeEmail} />
                                                    {t.updatedAt && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Blocked for {formatDistanceToNow(new Date(t.updatedAt))}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {t.sourceUrl && (
                                                <a href={t.sourceUrl} target="_blank" rel="noopener" className="text-slate-400 hover:text-primary">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>

                {/* Right Column: Meetings */}
                <div className="space-y-6">
                    {/* F) Next Meeting Brief */}
                    {viewModel.nextMeetingBrief && (
                        <Card className="bg-slate-900 text-white border-none shadow-lg">
                            <CardContent className="p-5 space-y-4">
                                <div>
                                    <div className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">Next Meeting</div>
                                    <div className="font-semibold text-lg leading-tight">{viewModel.nextMeetingBrief.meeting.title}</div>
                                    <div className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(viewModel.nextMeetingBrief.meeting.startTime), 'h:mm a')}
                                    </div>
                                </div>
                                <div className="flex -space-x-2">
                                    {viewModel.nextMeetingBrief.attendees.map(p => (
                                        <Avatar key={p.id} person={p} className="border-slate-900 w-8 h-8" />
                                    ))}
                                </div>
                                {viewModel.nextMeetingBrief.atRiskTasks.length > 0 && (
                                    <div className="bg-slate-800/50 rounded p-3 text-xs">
                                        <div className="font-medium mb-2 text-red-300">At Risk / Action Items</div>
                                        <ul className="space-y-1 list-disc pl-4 text-slate-300">
                                            {viewModel.nextMeetingBrief.atRiskTasks.map(t => (
                                                <li key={t.id}>{t.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming Meetings List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Meetings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {viewModel.upcomingMeetings.map(m => (
                                    <div key={m.id} className="flex gap-3 group">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded shrink-0">
                                            <span className="text-[10px] font-bold uppercase text-slate-500">{format(new Date(m.startTime), 'MMM')}</span>
                                            <span className="text-lg font-bold text-slate-800">{format(new Date(m.startTime), 'd')}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{m.title}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(m.startTime), 'h:mm a')}
                                            </div>
                                            <div className="flex -space-x-1 mt-2">
                                                {/* We don't have full attendee objects here unless we map them, let's just show counts or minimal */}
                                                {m.attendeeEmails.slice(0, 5).map(email => (
                                                    <div key={email} className="w-5 h-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px]" title={email}>
                                                        {email[0].toUpperCase()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {viewModel.upcomingMeetings.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming meetings.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function AttentionChip({ label, count, highlight }: { label: string, count: number, highlight?: boolean }) {
    if (count === 0 && !highlight) return null;
    return (
        <div className={cn(
            "px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2",
            highlight ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
        )}>
            <span className={cn("font-bold", highlight ? "text-white" : "text-slate-900")}>{count}</span>
            <span className="opacity-80">{label}</span>
        </div>
    );
}

function TaskGroup({ title, tasks, badgeColor }: { title: string, tasks: Task[], badgeColor: 'red' | 'orange' | 'slate' }) {
    if (tasks.length === 0) return null;
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                {title} <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{tasks.length}</span>
            </h3>
            <div className="border rounded divide-y">
                {tasks.map(t => (
                    <div key={t.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                    "w-2 h-2 rounded-full shrink-0",
                                    t.isBlocked ? "bg-red-500" : badgeColor === 'red' ? 'bg-red-500' : badgeColor === 'orange' ? 'bg-orange-500' : 'bg-slate-400'
                                )} />
                                <span className="font-medium text-sm truncate">{t.title}</span>
                                {t.isBlocked && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">BLOCKED</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <PersonBadge email={t.assigneeEmail} />
                                {t.dueDate && (
                                    <span>Due {format(new Date(t.dueDate), 'MMM d')}</span>
                                )}
                            </div>
                        </div>
                        {t.sourceUrl && (
                            <a href={t.sourceUrl} target="_blank" rel="noopener" className="text-slate-300 hover:text-slate-600">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}





function PersonBadge({ email, person }: { email?: string, person?: Person }) {
    // If we only have email, try to format loosely
    const display = person ? person.displayName : (email?.split('@')[0] || 'Unassigned');
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                {display[0]?.toUpperCase() || '?'}
            </div>
            <span>{display}</span>
        </div>
    );
}

function Avatar({ person, className }: { person: Person, className?: string }) {
    if (person?.avatarUrl) {
        return <img src={person.avatarUrl} alt={person.displayName} className={cn("rounded-full object-cover", className || "w-8 h-8")} />;
    }
    const initials = (person.displayName?.[0] || person.email?.[0] || '?').toUpperCase();
    return (
        <div className={cn("rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs", className || "w-8 h-8")}>
            {initials}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
            <div className="flex gap-4">
                <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <div className="h-64 bg-slate-100 rounded animate-pulse" />
                    <div className="h-32 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-96 bg-slate-100 rounded animate-pulse" />
            </div>
        </div>
    );
}
