'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    fullScreen?: boolean;
    className?: string;
}

export function LoadingOverlay({
    isLoading,
    message = 'Loading...',
    fullScreen = false,
    className
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm z-50",
                fullScreen
                    ? "fixed inset-0"
                    : "absolute inset-0 rounded-lg",
                className
            )}
        >
            <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="absolute inset-0 animate-ping">
                    <Loader2 className="w-8 h-8 text-primary/30" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
                {message}
            </p>
        </div>
    );
}

// Hook for managing loading state with minimum display time
export function useLoadingState(minDisplayMs: number = 500) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState('Loading...');
    const startTimeRef = React.useRef<number>(0);

    const startLoading = React.useCallback((msg?: string) => {
        startTimeRef.current = Date.now();
        if (msg) setMessage(msg);
        setIsLoading(true);
    }, []);

    const stopLoading = React.useCallback(async () => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, minDisplayMs - elapsed);

        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }

        setIsLoading(false);
    }, [minDisplayMs]);

    return { isLoading, message, startLoading, stopLoading };
}

import * as React from 'react';

// Inline loading spinner for buttons
export function ButtonSpinner({ className }: { className?: string }) {
    return (
        <Loader2 className={cn("w-4 h-4 animate-spin", className)} />
    );
}

// Skeleton loader for cards
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border bg-card p-6 space-y-4 animate-pulse", className)}>
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-5/6" />
            </div>
            <div className="h-8 bg-muted rounded w-1/4" />
        </div>
    );
}

// Page loading skeleton
export function PageSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-muted rounded-xl" />
        </div>
    );
}
