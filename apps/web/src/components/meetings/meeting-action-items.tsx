'use client';

import { ActionItem } from '@/types/meeting';
import { CheckSquare, User, Calendar, Plus, ExternalLink, ArrowRight, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import axios from 'axios';

export function MeetingActionItems({ actions }: { actions: ActionItem[] }) {
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());

    if (actions.length === 0) {
        return (
            <div className="bg-muted/10 border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
                No action items detected.
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'schedule-meeting': return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'create-doc': return <Plus className="w-4 h-4 text-purple-500" />;
            case 'reach-out': return <ExternalLink className="w-4 h-4 text-orange-500" />;
            default: return <CheckSquare className="w-4 h-4 text-emerald-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'schedule-meeting': return 'Schedule';
            case 'create-doc': return 'Create Doc';
            case 'reach-out': return 'Reach Out';
            default: return 'Task';
        }
    };

    const handleCreateTask = async (item: ActionItem) => {
        if (createdIds.has(item.id)) return;

        setCreatingId(item.id);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            await axios.post(`${API_URL}/todos`, {
                title: item.description,
                description: `Created from meeting action item. Owner: ${item.owner || 'Unknown'}`,
                dueDate: item.dueDate,
                status: 'pending',
                priority: 'medium'
            }, {
                headers: { 'x-user-id': 'default-user-id' }
            });

            setCreatedIds(prev => new Set(prev).add(item.id));
        } catch (error) {
            console.error('Failed to create task from action item', error);
            // Optionally show an error toast here
        } finally {
            setCreatingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckSquare className="w-4 h-4 text-zinc-500" />
                Action Items
            </h3>
            <div className="grid gap-3">
                {actions.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card rounded-xl border hover:border-primary/30 transition-colors">
                        {/* Icon & Details */}
                        <div className="flex-1 flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-background border flex items-center justify-center shadow-sm">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground">{item.description}</h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                                        <User className="w-3 h-3" />
                                        <span>{item.owner}</span>
                                    </div>
                                    {item.dueDate && (
                                        <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                                            <Calendar className="w-3 h-3" />
                                            <span>{format(new Date(item.dueDate), 'MMM d')}</span>
                                        </div>
                                    )}
                                    <span className="opacity-70 font-medium uppercase tracking-wider text-[10px]">
                                        {getTypeLabel(item.type)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 pl-12 sm:pl-0">
                            <button
                                onClick={() => handleCreateTask(item)}
                                disabled={creatingId === item.id || createdIds.has(item.id)}
                                className={`flex-1 sm:flex-none h-8 px-3 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5
                                    ${createdIds.has(item.id)
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-default'
                                        : 'bg-primary text-primary-foreground hover:opacity-90'
                                    }`}
                            >
                                {creatingId === item.id ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Creating...
                                    </>
                                ) : createdIds.has(item.id) ? (
                                    <>
                                        <Check className="w-3 h-3" />
                                        Task Created
                                    </>
                                ) : (
                                    'Create Task'
                                )}
                            </button>
                            {item.type === 'schedule-meeting' && (
                                <button className="flex-1 sm:flex-none h-8 px-3 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors whitespace-nowrap">
                                    Schedule
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
