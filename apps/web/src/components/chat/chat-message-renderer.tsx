
import { UIResponse, UIBlock, UIListItem, UIAction } from '@/types/chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';

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
                <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
                    <div className="font-semibold mb-1">Sources Checked:</div>
                    <div className="flex flex-wrap gap-2">
                        {uiResponse.debug.sourcesChecked.map((sc, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded border ${['connected', 'checked_ok'].includes(sc.status) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200'}`}>
                                {sc.source}: {sc.status}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function BlockRenderer({ block }: { block: UIBlock }) {
    switch (block.type) {
        case 'text':
            return <div className="text-sm prose dark:prose-invert max-w-none whitespace-pre-wrap">{block.markdown}</div>;

        case 'callout':
            const icons = {
                info: Info,
                warning: AlertTriangle,
                danger: AlertCircle,
                success: CheckCircle2
            } as const;
            const Icon = icons[block.tone] || Info;
            const colors = {
                info: 'bg-blue-50 text-blue-900 border-blue-200',
                warning: 'bg-amber-50 text-amber-900 border-amber-200',
                danger: 'bg-red-50 text-red-900 border-red-200',
                success: 'bg-green-50 text-green-900 border-green-200'
            };
            return (
                <div className={`p-4 rounded-md border flex gap-3 ${colors[block.tone] || colors.info}`}>
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{block.title}</h4>
                        {block.body && <p className="text-sm opacity-90 mt-1">{block.body}</p>}
                        {block.actions && (
                            <div className="flex gap-2 mt-3">
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
                            <div key={i} className="p-3 flex items-center justify-between gap-3 border-b last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {item.avatarUrl ? (
                                        <img src={item.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0 text-slate-500">
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
                                        <span key={bi} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase font-bold border">{b.label}</span>
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
                <div className="border rounded-lg bg-card p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                    {/* Calendar Widget */}
                    <div className="shrink-0 flex flex-col items-center bg-blue-50 text-blue-700 rounded-md border border-blue-100 overflow-hidden w-14">
                        <div className="bg-blue-600 text-white text-[10px] uppercase font-bold w-full text-center py-0.5">
                            {startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold py-1">
                            {startDate.getDate()}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base line-clamp-1 text-foreground" title={block.title}>{block.title}</h4>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                            <span>
                                {startDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })} - {endDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>
                        {block.location && <div className="text-xs text-muted-foreground mt-0.5 truncate">{block.location}</div>}

                        {block.action && (
                            <div className="mt-3">
                                <ActionRenderer action={block.action} />
                            </div>
                        )}
                    </div>
                </div>
            );

        case 'divider':
            return <hr className="my-4 border-slate-200" />;

        default:
            return null;
    }
}

function ActionRenderer({ action }: { action: UIAction }) {
    if (action.type === 'link') {
        return <a href={action.href} target="_blank" className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1">{action.label} <ExternalLink className="w-3 h-3" /></a>;
    }
    if (action.type === 'button') {
        const isConnect = action.action === 'connect_integration';
        const isOpenUrl = action.action === 'open_url';

        if (isConnect) {
            return <Link href="/settings/integrations" className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:opacity-90 inline-block">{action.label}</Link>
        }
        if (isOpenUrl && action.params?.url) {
            return <a href={action.params.url} target="_blank" className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 inline-block transition-colors">{action.label}</a>
        }

        return <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50">{action.label}</button>;
    }
    return null;
}
