
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, Mail, MessageSquare, GitCommit, Calendar, ExternalLink, CheckCircle, XCircle, AlertCircle, Sparkles, Filter, Check, Clock, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface UpdateItem {
    id: string;
    source: 'gmail' | 'slack' | 'github' | 'google_calendar';
    type: string;
    severity: 'urgent' | 'important' | 'info';
    title: string;
    body: string | null;
    occurredAt: string;
    url: string | null;
    isRead: boolean;
    metadata: any;
}

interface SourceCheck {
    source: string;
    status: 'connected' | 'not_connected' | 'checked_ok' | 'checked_empty' | 'error';
    count: number;
}

export default function UpdatesPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState<UpdateItem[]>([]);
    const [checks, setChecks] = useState<SourceCheck[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    // Filters
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [unreadOnly, setUnreadOnly] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchData = async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        try {
            const endpoint = refresh ? `${API_URL}/updates/refresh` : `${API_URL}/updates`;
            const method = refresh ? 'POST' : 'GET';

            const res = await fetch(endpoint, {
                method,
                headers: { 'x-user-id': 'default-user-id' } // Mock ID
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                // Initial GET returns array
                setItems(data);
            } else {
                // Refresh returns object
                setItems(data.items);
                setChecks(data.sourceChecks);
                setLastRefreshed(new Date(data.lastRefreshedAt));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const markRead = async (id: string, e: any) => {
        e.preventDefault(); e.stopPropagation();
        setItems(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i));
        await fetch(`${API_URL}/updates/${id}/read`, { method: 'POST', headers: { 'x-user-id': 'default-user-id' } });
    };

    const dismiss = async (id: string, e: any) => {
        e.preventDefault(); e.stopPropagation();
        setItems(prev => prev.filter(i => i.id !== id));
        await fetch(`${API_URL}/updates/${id}/dismiss`, { method: 'POST', headers: { 'x-user-id': 'default-user-id' } });
    };

    // Derived State
    const filteredItems = items.filter(i => {
        if (unreadOnly && i.isRead) return false;
        if (sourceFilter !== 'all' && i.source !== sourceFilter) return false;
        if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
        return true;
    });

    const notConnectedSources = ['gmail', 'slack', 'github', 'google_calendar'].filter(s => {
        const c = checks.find(c => c.source === s);
        return c?.status === 'not_connected';
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Updates</h1>
                    <p className="text-lg text-muted-foreground">Actionable insights from your connected tools.</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefreshed && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}</span>
                        </div>
                    )}
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-sm font-medium text-sm"
                    >
                        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        {refreshing ? 'Syncing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Connection Alerts */}
            {notConnectedSources.length > 0 && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-warning">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">
                            Missing connections: <span className="font-semibold text-foreground">{notConnectedSources.map(s => s === 'google_calendar' ? 'Calendar' : s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
                        </span>
                    </div>
                    <Link href="/settings/integrations" className="text-xs font-bold text-primary hover:underline px-3 py-1.5 bg-background rounded-md border shadow-sm">
                        Connect Now
                    </Link>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-1">
                    {/* Source Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <FilterButton label="All" active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')} />
                        <div className="w-px h-6 bg-border mx-1 hidden md:block" />
                        <FilterButton label="Gmail" active={sourceFilter === 'gmail'} onClick={() => setSourceFilter('gmail')} icon={<Mail className="w-3.5 h-3.5" />} />
                        <FilterButton label="Slack" active={sourceFilter === 'slack'} onClick={() => setSourceFilter('slack')} icon={<MessageCircle className="w-3.5 h-3.5" />} />
                        <FilterButton label="GitHub" active={sourceFilter === 'github'} onClick={() => setSourceFilter('github')} icon={<GitCommit className="w-3.5 h-3.5" />} />
                        <FilterButton label="Calendar" active={sourceFilter === 'google_calendar'} onClick={() => setSourceFilter('google_calendar')} icon={<Calendar className="w-3.5 h-3.5" />} />
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        {/* Severity Filter */}
                        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                            <button
                                onClick={() => setSeverityFilter('all')}
                                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", severityFilter === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setSeverityFilter('urgent')}
                                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", severityFilter === 'urgent' ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-destructive")}
                            >
                                Urgent
                            </button>
                            <button
                                onClick={() => setSeverityFilter('important')}
                                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", severityFilter === 'important' ? "bg-warning/10 text-warning shadow-sm" : "text-muted-foreground hover:text-warning")}
                            >
                                Important
                            </button>
                        </div>

                        {/* Unread Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", unreadOnly ? "bg-primary border-primary" : "bg-card border-muted-foreground/30")}>
                                {unreadOnly && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                            </div>
                            <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} className="hidden" />
                            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Unread only</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-3 min-h-[400px]">
                {loading && !items.length ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No updates found</h3>
                        <p className="text-muted-foreground max-w-sm text-center mt-2">
                            Everything looks clear! Adjust your filters or check back later for new notifications.
                        </p>
                        <button onClick={() => { setSourceFilter('all'); setSeverityFilter('all'); setUnreadOnly(false); }} className="mt-6 text-primary font-medium hover:underline text-sm">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredItems.map(item => (
                            <UpdateCard key={item.id} item={item} onRead={markRead} onDismiss={dismiss} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({ label, active, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-full text-xs font-medium border transition-all flex items-center gap-2 shadow-sm",
                active
                    ? "bg-primary text-primary-foreground border-primary shadow-md hover:opacity-95"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function UpdateCard({ item, onRead, onDismiss }: { item: UpdateItem, onRead: any, onDismiss: any }) {
    const isUrgent = item.severity === 'urgent';
    const isRead = item.isRead;

    const icons: Record<string, any> = {
        gmail: Mail,
        slack: MessageCircle,
        github: GitCommit,
        google_calendar: Calendar
    };
    const Icon = icons[item.source] || CheckCircle;

    return (
        <div className={cn(
            "group relative p-5 rounded-xl border bg-card transition-all duration-200",
            !isRead ? "shadow-md border-border" : "shadow-sm border-border/40 opacity-80 hover:opacity-100",
            isUrgent && !isRead && "ring-1 ring-destructive/20 bg-destructive/5"
        )}>
            <div className="flex items-start gap-4">
                {/* Icon Column */}
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    item.source === 'gmail' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        item.source === 'slack' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                            item.source === 'github' ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300' :
                                'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                )}>
                    <Icon className="w-5 h-5" />
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                {item.source === 'google_calendar' ? 'Calendar' : item.source}
                            </span>

                            {/* Badges */}
                            {isUrgent && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20">
                                    <AlertCircle className="w-3 h-3" /> Urgent
                                </span>
                            )}
                            {item.severity === 'important' && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-warning/10 text-warning border border-warning/20">
                                    Important
                                </span>
                            )}

                            {/* Unread Dot */}
                            {!isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" title="Unread" />
                            )}
                        </div>

                        <span className="text-xs text-muted-foreground/60 whitespace-nowrap tabular-nums">
                            {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                        </span>
                    </div>

                    <h3 className={cn("font-semibold text-lg leading-tight text-foreground mb-1.5", isRead && "font-normal text-muted-foreground")}>
                        {item.title}
                    </h3>

                    {item.body && (
                        <p className={cn("text-sm leading-relaxed line-clamp-2 max-w-3xl", isRead ? "text-muted-foreground/70" : "text-muted-foreground")}>
                            {item.body}
                        </p>
                    )}

                    {/* Actions Row - Always visible but subtle */}
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/40">
                        {item.url && (
                            <a href={item.url} target="_blank" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-primary/5">
                                Open <ExternalLink className="w-3 h-3" />
                            </a>
                        )}

                        {!isRead && (
                            <button onClick={(e) => onRead(item.id, e)} className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-primary/5">
                                <CheckCircle className="w-3.5 h-3.5" /> Mark as Read
                            </button>
                        )}

                        <button onClick={(e) => onDismiss(item.id, e)} className="text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1.5 ml-auto transition-colors px-2 py-1 rounded-md hover:bg-destructive/5">
                            <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
