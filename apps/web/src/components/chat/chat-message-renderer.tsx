
import { UIResponse, UIBlock, UIListItem, UIAction } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils'; // Ensure cn is imported

export function ChatMessageRenderer({ uiResponse }: { uiResponse: UIResponse }) {
    return (
        <div className="space-y-4 w-full">
            {/* Header */}
            {(uiResponse.title || uiResponse.subtitle) && (
                <div className="mb-2">
                    {uiResponse.title && <h3 className="text-lg font-semibold">{uiResponse.title}</h3>}
                    {uiResponse.subtitle && <p className="text-sm text-muted-foreground">{uiResponse.subtitle}</p>}
                </div>
            )}

            {/* Blocks */}
            {uiResponse.blocks.map((block, idx) => (
                <BlockRenderer key={idx} block={block} />
            ))}

            {/* Debug Info (at bottom) */}
            {uiResponse.debug && uiResponse.debug.sourcesChecked.length > 0 && (
                <div className="mt-6 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                    {uiResponse.debug.sourcesChecked.map((sc, i) => (
                        <span key={i} className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1.5 transition-colors cursor-help",
                            ['connected', 'checked_ok'].includes(sc.status)
                                ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                        )} title={`${sc.source}: ${sc.status}`}>
                            {['connected', 'checked_ok'].includes(sc.status) && <CheckCircle2 className="w-3 h-3" />}
                            {sc.source}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function BlockRenderer({ block }: { block: UIBlock }) {
    switch (block.type) {
        case 'text':
            return <MarkdownText text={block.markdown} />;

        case 'callout':
            const icons = {
                info: Info,
                warning: AlertTriangle,
                danger: AlertCircle,
                success: CheckCircle2
            } as const;
            const Icon = icons[block.tone] || Info;
            const colors = {
                info: 'bg-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20',
                warning: 'bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20',
                danger: 'bg-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-500/20',
                success: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            };
            return (
                <div className={`p-4 rounded-xl border flex gap-3.5 ${colors[block.tone] || colors.info}`}>
                    <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm tracking-tight">{block.title}</h4>
                        {block.body && <MarkdownText text={block.body} className="text-sm opacity-90 mt-1.5 leading-relaxed" />}
                        {block.actions && (
                            <div className="flex gap-2 mt-3 pt-1">
                                {block.actions.map((action, i) => <ActionRenderer key={i} action={action} />)}
                            </div>
                        )}
                    </div>
                </div>
            );

        case 'list':
            return (
                <Card>
                    {block.title && <CardHeader className="pb-2"><CardTitle className="text-base">{block.title}</CardTitle></CardHeader>}
                    <CardContent className="p-0">
                        {block.items.map((item, i) => (
                            <div key={i} className="p-3 flex items-center justify-between gap-3 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {item.avatarUrl ? (
                                        <img src={item.avatarUrl} className="w-8 h-8 rounded-full bg-muted object-cover shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 text-muted-foreground">
                                            {(item.title[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{item.title}</div>
                                        {item.subtitle && <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {item.badges?.map((b, bi) => (
                                        <span key={bi} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded uppercase font-bold border">{b.label}</span>
                                    ))}
                                    {item.href && (
                                        <Link href={item.href} target="_blank" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-4 h-4" /></Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            );

        case 'event':
            const startDate = new Date(block.start);
            const endDate = new Date(block.end);
            return (
                <div className="border rounded-xl bg-card p-0 shadow-sm flex flex-col sm:flex-row hover:shadow-md transition-shadow overflow-hidden group">
                    {/* Left/Top Decor Strip */}
                    <div className="h-1.5 sm:h-auto sm:w-1.5 bg-primary/70" />

                    <div className="flex-1 flex items-start gap-4 p-4">
                        {/* Calendar Widget */}
                        <div className="shrink-0 flex flex-col items-center bg-background rounded-lg border shadow-sm overflow-hidden w-14 h-14 group-hover:border-primary/50 transition-colors">
                            <div className="bg-muted w-full text-center py-0.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                {startDate.toLocaleString('en-US', { month: 'short' })}
                            </div>
                            <div className="text-xl font-bold py-1 text-foreground flex-1 flex items-center justify-center">
                                {startDate.getDate()}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base line-clamp-1 text-foreground tracking-tight" title={block.title}>{block.title}</h4>
                            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="flex items-center gap-1.5 text-xs font-medium bg-muted/50 px-2 py-0.5 rounded-md">
                                    <Calendar className="w-3 h-3" />
                                    {startDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })} - {endDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                                {block.location && <span className="text-xs truncate max-w-[150px] opacity-80" title={block.location}>📍 {block.location}</span>}
                            </div>

                            {block.action && (
                                <div className="mt-3.5">
                                    <ActionRenderer action={block.action} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );

        case 'divider':
            return <hr className="my-4 border-border" />;

        default:
            return null;
    }
}

function ActionRenderer({ action }: { action: UIAction }) {
    if (action.type === 'link') {
        return <a href={action.href} target="_blank" className="px-3 py-1.5 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium rounded-md inline-flex items-center gap-2 transition-colors shadow-sm">{action.label} <ExternalLink className="w-3 h-3 opacity-70" /></a>;
    }
    if (action.type === 'button') {
        const isConnect = action.action === 'connect_integration';
        const isOpenUrl = action.action === 'open_url';

        if (isConnect) {
            return <Link href="/settings/integrations" className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:opacity-90 inline-block">{action.label}</Link>
        }
        if (isOpenUrl && action.params?.url) {
            return <a href={action.params.url} target="_blank" className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 inline-block transition-colors">{action.label}</a>
        }

        return <button className="px-3 py-1.5 bg-card border border-border text-foreground text-xs font-medium rounded hover:bg-muted/50">{action.label}</button>;
    }
    return null;
}

function MarkdownText({ text, className }: { text: string, className?: string }) {
    if (!text) return null;

    // Split by **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
        <div className={className || "text-sm prose dark:prose-invert max-w-none whitespace-pre-wrap"}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                    return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
}
