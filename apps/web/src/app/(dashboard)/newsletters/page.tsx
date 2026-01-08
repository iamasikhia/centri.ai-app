'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, RefreshCw, Filter, ExternalLink, User, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Newsletter {
    id: string;
    title: string;
    body: string; // Summary
    source: string;
    occurredAt: string;
    url?: string;
    metadata?: {
        senderName?: string;
        from?: string;
        originalSnippet?: string;
    };
}

export default function NewslettersPage() {
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Newsletter | null>(null);





    const fetchData = async () => {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${API_URL}/updates/newsletters`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                setNewsletters(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            await fetch(`${API_URL}/updates/refresh`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            await new Promise(r => setTimeout(r, 2000));
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    // Sender Initials Helper
    const getInitials = (name?: string) => {
        if (!name) return 'NL';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleDismiss = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNewsletters(prev => prev.filter(n => n.id !== id));

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            await fetch(`${API_URL}/updates/${id}/dismiss`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (error) {
            console.error('Failed to dismiss', error);
        }
    };

    // Loading State
    if (loading && newsletters.length === 0) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen pb-20 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Newsletters
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Your central hub for market intelligence. We curate and summarize your subscriptions so you can focus on strategy.
                    </p>
                </div>

                {/* Actions & Global Controls */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="h-9 px-4 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin text-indigo-500")} />
                        {refreshing ? 'Syncing Feed...' : 'Sync Now'}
                    </Button>
                </div>
            </div>



            {/* Empty State */}
            {newsletters.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-3xl bg-muted/5">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6">
                        <Mail className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        No newsletters yet
                    </h3>
                    <p className="text-muted-foreground text-base max-w-sm mx-auto">
                        Connect your accounts or wait for new issues to arrive. We will auto-detect newsletters for you.
                    </p>
                    <Button onClick={handleRefresh} variant="link" className="mt-6 text-indigo-600 dark:text-indigo-400 font-medium h-auto p-0 hover:no-underline hover:opacity-80">
                        Refresh Feed
                    </Button>
                </div>
            )}

            {/* News Feed */}
            {loading ? (
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 p-6 rounded-2xl border bg-card/50">
                            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                            <div className="space-y-3 flex-1">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {newsletters.map(item => (
                        <Card
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 cursor-pointer border-transparent ring-1 ring-border/50 hover:ring-indigo-500/30 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50"
                        >
                            {/* Dismiss Action */}
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900 shadow-sm"
                                    onClick={(e) => handleDismiss(e, item.id)}
                                    title="Dismiss this update"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-6 sm:p-7 flex gap-6 items-start">
                                {/* Sender Avatar */}
                                <div className="shrink-0 pt-1.5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/50">
                                        {getInitials(item.metadata?.senderName || item.metadata?.from)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-3">
                                    {/* Meta Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {item.metadata?.senderName || 'Unknown Sender'}
                                            </span>
                                            {item.metadata?.from && (
                                                <span className="text-xs text-muted-foreground/60 hidden sm:block truncate max-w-[200px]">
                                                    • {item.metadata.from}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground/40">•</span>
                                            <span className="text-xs font-medium text-muted-foreground/80">
                                                {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title & Body */}
                                    <div>
                                        <h4 className="text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-muted-foreground text-[15px] leading-relaxed line-clamp-2">
                                            {item.body}
                                        </p>
                                    </div>

                                    {/* Footer / Call to Action */}
                                    <div className="pt-2 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                        Read Summary
                                        <ArrowRight className="w-4 h-4 ml-1.5" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Detail Sheet */}
            <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 gap-0">
                    {selectedItem && (
                        <div className="flex flex-col h-full bg-background">
                            {/* Sheet Header Area with styling */}
                            <div className="p-8 border-b bg-muted/10">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-muted-foreground border border-border">
                                        {getInitials(selectedItem.metadata?.senderName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-base truncate">
                                            {selectedItem.metadata?.senderName}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(selectedItem.occurredAt).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <SheetTitle className="text-2xl font-bold leading-tight tracking-tight">
                                    {selectedItem.title}
                                </SheetTitle>
                            </div>

                            {/* Sheet Content Body */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 mb-8">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        AI Summary
                                    </h4>
                                    <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                                        {selectedItem.body}
                                    </p>
                                </div>

                                {selectedItem.metadata?.originalSnippet && (
                                    <div className="mb-8">
                                        <h5 className="text-sm font-semibold text-muted-foreground mb-2">Original Snippet</h5>
                                        <div className="text-sm text-muted-foreground/80 italic border-l-4 border-muted pl-4 py-2 bg-muted/5 rounded-r-lg">
                                            "{selectedItem.metadata.originalSnippet}..."
                                        </div>
                                    </div>
                                )}

                                {selectedItem.url && (
                                    <Button asChild size="lg" className="w-full gap-2 text-base font-semibold shadow-lg shadow-primary/20">
                                        <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                                            Read Original Article <ExternalLink className="w-4 h-4 ml-1" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
