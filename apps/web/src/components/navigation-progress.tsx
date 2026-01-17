'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Reset when navigation completes
        setIsNavigating(false);
        setProgress(100);

        const timeout = setTimeout(() => setProgress(0), 200);
        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    useEffect(() => {
        // Listen for click events on links to start progress
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href && link.href.startsWith(window.location.origin)) {
                const url = new URL(link.href);
                if (url.pathname !== pathname) {
                    setIsNavigating(true);
                    setProgress(20);

                    // Simulate progress
                    const interval = setInterval(() => {
                        setProgress((prev) => {
                            if (prev >= 90) {
                                clearInterval(interval);
                                return prev;
                            }
                            return prev + 10;
                        });
                    }, 100);
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [pathname]);

    if (progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none"
            style={{ opacity: isNavigating ? 1 : 0, transition: 'opacity 200ms' }}
        >
            <div
                className="h-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
