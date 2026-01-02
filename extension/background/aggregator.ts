import { ActivityRecord } from './tracker.js';

export interface DailySummaryData {
    date: string;
    totalActiveSeconds: number;
    categoryTotals: {
        communication: number;
        building: number;
        research: number;
        meetings: number;
        admin: number;
    };
    topDomains: Array<{ domain: string; seconds: number }>;
    focusWindow: { start: number; end: number } | null;
    contextSwitchCount: number;
}

/**
 * Aggregate activities into a daily summary
 */
export function aggregateDailySummary(activities: ActivityRecord[]): DailySummaryData {
    const categoryTotals = {
        communication: 0,
        building: 0,
        research: 0,
        meetings: 0,
        admin: 0
    };

    const domainMap = new Map<string, number>();
    let totalActiveSeconds = 0;
    let contextSwitchCount = activities.length;

    // Aggregate by category and domain
    for (const activity of activities) {
        const cat = activity.category as keyof typeof categoryTotals;
        if (categoryTotals[cat] !== undefined) {
            categoryTotals[cat] += activity.durationSeconds;
        }

        totalActiveSeconds += activity.durationSeconds;

        const existing = domainMap.get(activity.domain) || 0;
        domainMap.set(activity.domain, existing + activity.durationSeconds);
    }

    // Get top 5 domains
    const topDomains = Array.from(domainMap.entries())
        .map(([domain, seconds]) => ({ domain, seconds }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 5);

    // Find longest uninterrupted focus window
    const focusWindow = findLongestFocusWindow(activities);

    const today = new Date().toISOString().split('T')[0];

    return {
        date: today,
        totalActiveSeconds,
        categoryTotals,
        topDomains,
        focusWindow,
        contextSwitchCount
    };
}

/**
 * Find the longest continuous focus period
 * (activities within 2 minutes of each other count as continuous)
 */
function findLongestFocusWindow(
    activities: ActivityRecord[]
): { start: number; end: number } | null {
    if (activities.length === 0) return null;

    const sorted = [...activities].sort((a, b) => a.startTime - b.startTime);

    let currentStart = sorted[0].startTime;
    let currentEnd = sorted[0].endTime || sorted[0].startTime;
    let longestStart = currentStart;
    let longestEnd = currentEnd;
    let longestDuration = currentEnd - currentStart;

    const GAP_THRESHOLD = 2 * 60 * 1000; // 2 minutes

    for (let i = 1; i < sorted.length; i++) {
        const activity = sorted[i];
        const gap = activity.startTime - currentEnd;

        if (gap <= GAP_THRESHOLD) {
            // Continue the window
            currentEnd = activity.endTime || activity.startTime;
        } else {
            // Check if current window is longest
            const duration = currentEnd - currentStart;
            if (duration > longestDuration) {
                longestDuration = duration;
                longestStart = currentStart;
                longestEnd = currentEnd;
            }

            // Start new window
            currentStart = activity.startTime;
            currentEnd = activity.endTime || activity.startTime;
        }
    }

    // Final check
    const duration = currentEnd - currentStart;
    if (duration > longestDuration) {
        longestStart = currentStart;
        longestEnd = currentEnd;
    }

    return {
        start: longestStart,
        end: longestEnd
    };
}
