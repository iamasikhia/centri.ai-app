'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to track user activity for DAU/WAU/MAU analytics
 * Sends activity ping to backend on page navigation (max once per hour)
 */
export function useActivityTracker() {
    const pathname = usePathname();
    const lastTrackedRef = useRef<number>(0);
    const TRACKING_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

    useEffect(() => {
        const now = Date.now();

        // Only track if more than 1 hour since last track
        if (now - lastTrackedRef.current < TRACKING_INTERVAL_MS) {
            return;
        }

        const trackActivity = async () => {
            try {
                await fetch(`${API_URL}/activity/track`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': 'default-user-id' // Replace with actual user ID in production
                    },
                    body: JSON.stringify({
                        activityType: 'page_view',
                        page: pathname
                    })
                });
                lastTrackedRef.current = now;
            } catch (e) {
                // Silently fail - activity tracking is non-critical
                console.debug('Activity tracking failed:', e);
            }
        };

        trackActivity();
    }, [pathname]);
}

/**
 * Component that tracks activity - can be placed in layout
 */
export function ActivityTracker() {
    useActivityTracker();
    return null;
}
