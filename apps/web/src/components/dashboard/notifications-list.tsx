
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import {
    Mail,
    Github,
    Slack,
    Calendar,
    CheckSquare,
    AlertCircle,
    Info,
    MessageSquare,
    ExternalLink,
    Bell,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Helper to map source to icon
const getSourceIcon = (source: string) => {
    switch (source) {
        case 'gmail': return <Mail className="w-5 h-5 text-red-500" />;
        case 'github': return <Github className="w-5 h-5 text-gray-900 dark:text-white" />;
        case 'slack': return <Slack className="w-5 h-5 text-purple-500" />; // Slack colors are multi, purple is close enough representation or use colorful SVG
        case 'google_calendar': return <Calendar className="w-5 h-5 text-blue-500" />;
        case 'tasks': return <CheckSquare className="w-5 h-5 text-emerald-500" />;
        case 'internal':
        case 'stakeholders': return <Users className="w-5 h-5 text-indigo-500" />;
        default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
};

const getSeverityStyles = (severity: string) => {
    switch (severity) {
        case 'urgent': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30';
        case 'important': return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30';
        default: return 'bg-card border-border/50 hover:bg-muted/50';
    }
};

export interface UpdateItem {
    id: string;
    source: string;
    type: string;
    severity: string;
    title: string;
    body?: string;
    occurredAt: string;
    url?: string;
    metadata?: any;
    isRead: boolean;
}

export function NotificationsList({ updates, onMarkRead, onDismiss }: {
    updates: UpdateItem[],
    onMarkRead?: (id: string) => void,
    onDismiss?: (id: string) => void
}) {
    // Group updates
    const grouped = updates.reduce((acc, item) => {
        const date = new Date(item.occurredAt);
        let key = 'Earlier';
        if (isToday(date)) key = 'Today';
        else if (isYesterday(date)) key = 'Yesterday';

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, UpdateItem[]>);

    const sections = ['Today', 'Yesterday', 'Earlier'].filter(k => grouped[k]?.length > 0);

    if (updates.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <div className="bg-muted/30 p-4 rounded-full w-fit mx-auto mb-4">
                    <Bell className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="max-w-xs mx-auto mt-2 text-sm opacity-80">
                    No new notifications. Enjoy your focused time.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {sections.map(section => (
                <div key={section} className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                        {section}
                    </h3>
                    <div className="space-y-3">
                        {grouped[section].map(item => (
                            <NotificationCard
                                key={item.id}
                                item={item}
                                onMarkRead={onMarkRead}
                                onDismiss={onDismiss}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function NotificationCard({ item, onMarkRead, onDismiss }: {
    item: UpdateItem,
    onMarkRead?: (id: string) => void,
    onDismiss?: (id: string) => void
}) {
    return (
        <div className={cn(
            "relative group flex gap-4 p-4 rounded-xl border transition-all duration-200",
            getSeverityStyles(item.severity),
            !item.isRead && "shadow-sm ring-1 ring-primary/5"
        )}>
            {/* Mark Read Indicator */}
            {!item.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}

            {/* Icon */}
            <div className="mt-1 shrink-0 p-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm h-fit">
                {getSourceIcon(item.source)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-foreground leading-tight">
                        {item.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(item.occurredAt), { addSuffix: true })}
                    </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {item.body}
                </p>

                {/* Metadata/Actions */}
                <div className="pt-2 flex items-center gap-3">
                    {item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                            Open <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/50 border">
                        <span className="capitalize">{item.source.replace('_', ' ')}</span>
                        <span className="opacity-40">•</span>
                        <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isRead && onMarkRead && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onMarkRead(item.id)}>
                                Mark read
                            </Button>
                        )}
                        {onDismiss && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => onDismiss(item.id)}>
                                Dismiss
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
