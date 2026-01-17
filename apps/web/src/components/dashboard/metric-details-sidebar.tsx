import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { X, Check, User, Calendar, Target, FileText, ArrowLeft, Loader2, CheckCircle, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailedMetric } from "@/lib/dashboard-utils";

import { Task, Meeting } from "@/lib/dashboard-utils";

interface MetricDetailsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    metric: DetailedMetric | null;
    githubData?: any;
    blockers?: Task[];
    meetings?: Meeting[];
    tasks?: Task[];
}

export function MetricDetailsSidebar({ isOpen, onClose, metric, githubData, blockers = [], meetings = [], tasks = [] }: MetricDetailsSidebarProps) {
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    if (!metric) return null;

    // Filter out dismissed/converted items
    const filterDismissed = (itemsList: any[]) => {
        return itemsList.filter(item => !dismissedIds.has(item.id));
    };

    let items: any[] = [];
    let type = 'general';
    let actualValue = metric.value; // Default to passed value

    if (metric.id === 'blocked-items') {
        type = 'blocker';

        // 1. Blocked Tasks
        items = blockers.map(b => ({
            id: b.id,
            title: b.title,
            description: `Blocked by: ${b.blockedBy ? b.blockedBy.map(x => x.title || 'Unknown').join(', ') : 'Unknown'}`,
            date: new Date(b.updatedAt || new Date()).toLocaleString(),
            status: 'Blocked Task'
        }));

        // 2. Transcript Blockers (from meetings)
        meetings.forEach((m: any) => {
            if (m.blockers && Array.isArray(m.blockers)) {
                m.blockers.forEach((b: string | any, i: number) => {
                    const text = typeof b === 'string' ? b : b.text || b.description;
                    items.push({
                        id: `${m.id}-blocker-${i}`,
                        title: text,
                        description: `Raised in meeting: ${m.title}`,
                        date: new Date(m.startTime).toLocaleString(),
                        status: 'Meeting Blocker'
                    });
                });
            }
        });

        actualValue = items.length;

    } else if (metric.id === 'action-items') {
        type = 'action-item';
        items = [];

        // Extract action items from meetings (same logic as dashboard service)
        meetings.forEach((m: any) => {
            // Action items could be in different formats depending on how they were stored
            // Check for actionItems array directly or parse from decisions if needed
            let actionItemsData: any[] = [];

            // Try to get action items from the meeting object
            if (m.actionItems && Array.isArray(m.actionItems)) {
                actionItemsData = m.actionItems;
            }

            actionItemsData.forEach((item: any, i: number) => {
                const title = typeof item === 'string' ? item : item.description || item.item || item.title || item.action;
                const owner = typeof item === 'object' ? (item.owner || item.assignee || 'Unassigned') : 'Unassigned';
                const completed = typeof item === 'object' ? (item.completed === true || item.status === 'completed' || item.status === 'done') : false;
                const priority = typeof item === 'object' ? item.priority : 'Medium';

                // Only show open (non-completed) items
                if (!completed && title) {
                    items.push({
                        id: `${m.id}-action-${i}`,
                        title: title,
                        description: `From: ${m.title}`,
                        date: new Date(m.startTime).toLocaleString(),
                        status: `${priority || 'Medium'} Priority`,
                        owner: owner,
                        // Additional data for converting to task
                        meetingId: m.id,
                        itemIndex: i,
                        priority: priority || 'Medium',
                        meetingTitle: m.title
                    });
                }
            });
        });

        actualValue = items.length;

    } else if (metric.id === 'decisions') {
        type = 'decision';
        items = [];
        meetings.forEach((m: any) => {
            if (m.decisions && Array.isArray(m.decisions)) {
                m.decisions.forEach((d: string | any, i: number) => {
                    const text = typeof d === 'string' ? d : d.text || d.description;
                    items.push({
                        id: `${m.id}-dec-${i}`,
                        title: text,
                        description: `Decided in: ${m.title}`,
                        date: new Date(m.startTime).toLocaleString(),
                        status: 'Decision'
                    });
                });
            }
        });
        actualValue = items.length;
    } else if (githubData) {
        if (metric.id === 'repo-updates') {
            type = 'commit';
            const commits = githubData.commits || [];

            // Recalculate Active Dev Days based on filtered data
            const now = new Date();
            const commitsLast7d = commits.filter((c: any) => {
                const commitDate = new Date(c.date);
                const daysDiff = Math.floor((now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7;
            });

            // Count unique days
            const uniqueDays = new Set(
                commitsLast7d.map((c: any) => new Date(c.date).toDateString())
            ).size;

            actualValue = uniqueDays;

            items = commits.slice(0, 15).map((c: any) => ({
                id: c.sha,
                title: c.message,
                description: `By ${c.author} in ${c.repo}`,
                date: new Date(c.date).toLocaleString()
            }));
        } else if (metric.id === 'in-progress') {
            type = 'in-progress';

            // Show actual tasks that are In Progress / Open
            // This now strictly separates "Tasks" from "Action Items"
            items = tasks.filter(t => {
                const s = t.status?.toLowerCase() || 'open';
                return s === 'open' || s === 'in-progress' || s === 'in_progress' || s === 'pending';
            }).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description || `Assigned to: ${t.assigneeEmail || 'Unassigned'}`,
                date: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
                status: t.status || 'Open',
                owner: t.assigneeEmail || 'Unassigned',
                priority: t.priority
            }));

            actualValue = items.length;
        } else if (metric.id === 'shipped') {
            type = 'release';
            const releases = githubData.releases || [];

            // Recalculate releases count
            const now = new Date();
            const releasesLast7d = releases.filter((r: any) => {
                const releaseDate = new Date(r.published_at);
                const daysDiff = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7;
            });

            actualValue = releasesLast7d.length;

            items = releases.slice(0, 15).map((r: any) => ({
                id: r.id,
                title: r.name || r.tag_name,
                description: `Release ${r.tag_name} in ${r.repo}`,
                date: new Date(r.published_at).toLocaleString()
            }));
        }
    }

    // Fallback if no specific data or empty
    if (items.length === 0) {
        items = [
            { id: '1', title: 'No detailed data available', description: 'Try making some commits or PRs!', date: 'Now' }
        ];
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">{metric.title} Details</SheetTitle>
                    </div>
                    <SheetDescription className="text-muted-foreground">
                        {metric.description}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Big Stats */}
                    <div className="p-6 bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-2">
                        <span className="text-5xl font-bold tracking-tight">
                            {type === 'action-item' ? filterDismissed(items).length : actualValue}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Current Value</span>
                    </div>

                    {/* Breakdown List */}
                    <div>
                        {(() => {
                            const displayItems = filterDismissed(items);
                            const displayCount = displayItems.length;
                            return (
                                <>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        {type === 'action-item' ? `Open Action Items (${displayCount})` :
                                            type === 'blocker' ? `Active Blockers (${displayCount})` :
                                                type === 'decision' ? `Decisions Made (${displayCount})` :
                                                    type === 'in-progress' ? `In Progress Tasks (${displayCount})` :
                                                        `Recent Activity (${displayCount})`}
                                    </h3>
                                    <div className="space-y-3">
                                        {displayItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors cursor-pointer hover:border-primary/50 hover:shadow-sm"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                                                    <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded shrink-0">{item.date}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {item.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    {item.owner && item.owner !== 'Unassigned' && (
                                                        <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                                                            👤 {item.owner}
                                                        </span>
                                                    )}
                                                    {item.status && (
                                                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 uppercase">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </SheetContent>

            {/* Detail Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold leading-tight pr-8">
                            {selectedItem?.title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {type === 'action-item' ? 'Action Item Details' :
                                type === 'blocker' ? 'Blocker Details' :
                                    type === 'decision' ? 'Decision Details' :
                                        type === 'in-progress' ? 'In Progress Task' : 'Item Details'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-6 pt-2">
                            {/* Full Description */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    Description
                                </div>
                                <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                                    {selectedItem.title}
                                </p>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Owner */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        Assignee
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg text-sm font-medium">
                                            {selectedItem.owner || 'Unassigned'}
                                        </span>
                                    </div>
                                </div>

                                {/* Priority/Status */}
                                {selectedItem.status && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Target className="w-4 h-4" />
                                            Priority
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase ${selectedItem.status.toLowerCase().includes('high')
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                                : selectedItem.status.toLowerCase().includes('medium')
                                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                                }`}>
                                                {selectedItem.status}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Source */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <FileText className="w-4 h-4" />
                                        Source
                                    </div>
                                    <p className="text-sm">
                                        {selectedItem.description}
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        Created
                                    </div>
                                    <p className="text-sm">
                                        {selectedItem.date}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                    Close
                                </Button>

                                {/* Action buttons for action items and in-progress tasks from transcripts */}
                                {(type === 'action-item' || type === 'in-progress') && selectedItem.meetingId && (
                                    <div className="flex gap-2">
                                        {/* Dismiss button */}
                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                setIsDismissing(true);
                                                try {
                                                    const res = await fetch(`${API_URL}/action-items/${selectedItem.id}/dismiss`, {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'x-user-id': 'default-user-id'
                                                        },
                                                        body: JSON.stringify({
                                                            meetingId: selectedItem.meetingId,
                                                            itemIndex: selectedItem.itemIndex,
                                                            reason: 'Marked as done'
                                                        })
                                                    });

                                                    if (res.ok) {
                                                        setDismissedIds(prev => new Set(prev).add(selectedItem.id));
                                                        setSelectedItem(null);
                                                    }
                                                } catch (e) {
                                                    console.error('Failed to dismiss:', e);
                                                } finally {
                                                    setIsDismissing(false);
                                                }
                                            }}
                                            disabled={isDismissing || isConverting}
                                            className="gap-2"
                                        >
                                            {isDismissing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Dismissing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4" />
                                                    Mark as Done
                                                </>
                                            )}
                                        </Button>

                                        {/* Add as Task button */}
                                        <Button
                                            onClick={async () => {
                                                setIsConverting(true);
                                                try {
                                                    const res = await fetch(`${API_URL}/action-items/${selectedItem.id}/convert-to-task`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'x-user-id': 'default-user-id'
                                                        },
                                                        body: JSON.stringify({
                                                            title: selectedItem.title,
                                                            owner: selectedItem.owner,
                                                            priority: selectedItem.priority?.toLowerCase() || 'medium',
                                                            meetingId: selectedItem.meetingId,
                                                            itemIndex: selectedItem.itemIndex
                                                        })
                                                    });

                                                    if (res.ok) {
                                                        setDismissedIds(prev => new Set(prev).add(selectedItem.id));
                                                        setSelectedItem(null);
                                                    }
                                                } catch (e) {
                                                    console.error('Failed to convert to task:', e);
                                                } finally {
                                                    setIsConverting(false);
                                                }
                                            }}
                                            disabled={isConverting || isDismissing}
                                            className="gap-2"
                                        >
                                            {isConverting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Converting...
                                                </>
                                            ) : (
                                                <>
                                                    <ListTodo className="w-4 h-4" />
                                                    Add as Task
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Sheet>
    );
}
