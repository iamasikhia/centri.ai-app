'use client';

import { RecommendedAction } from '@/lib/dashboard-utils';
import { Button } from '@/components/ui/button';
import { X, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface RecommendedActionsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    actions: RecommendedAction[];
}

export function RecommendedActionsSidebar({ isOpen, onClose, actions }: RecommendedActionsSidebarProps) {
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setIsVisible(true);
        else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Prevent rendering if closed and animation done
    if (!isVisible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300 pointer-events-auto backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    "pointer-events-auto relative h-full w-full max-w-sm bg-background shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Zap className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                        Recommended Actions
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {actions?.map(action => (
                        <div
                            key={action.id}
                            className="group flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm hover:shadow-md cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <span className={cn(
                                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                    action.priority === 'High' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                        action.priority === 'Medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                )}>
                                    {action.priority} Priority
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                            </div>

                            <h4 className="font-semibold text-sm leading-tight">
                                {action.title}
                            </h4>

                            <p className="text-xs text-muted-foreground leading-snug">
                                {action.reason}
                            </p>

                            {action.linkedEntity && (
                                <div className="mt-2 text-[10px] font-medium text-muted-foreground bg-muted inline-block px-2 py-1 rounded self-start">
                                    Ref: {action.linkedEntity}
                                </div>
                            )}
                        </div>
                    ))}

                    {(!actions || actions.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No immediate actions needed.</p>
                            <p className="text-xs">You're all caught up!</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-muted/10 text-center">
                    <p className="text-[10px] text-muted-foreground">
                        AI suggestions based on your recent activity
                    </p>
                </div>
            </div>
        </div>
    );
}
