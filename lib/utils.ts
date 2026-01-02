import { format, startOfDay, parseISO } from 'date-fns';

/**
 * Format seconds into human-readable time
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}

/**
 * Format time range for focus window
 */
export function formatTimeRange(start: Date, end: Date): string {
    return `${format(start, 'h:mma')}–${format(end, 'h:mma')}`;
}

/**
 * Get percentage of day
 */
export function getPercentageOfDay(seconds: number, totalSeconds: number): number {
    if (totalSeconds === 0) return 0;
    return Math.round((seconds / totalSeconds) * 100);
}

/**
 * Format date string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE, MMMM d, yyyy');
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
    return format(startOfDay(new Date()), 'yyyy-MM-dd');
}
