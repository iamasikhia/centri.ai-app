import { aggregateDailySummary } from './aggregator.js';
const API_URL = 'http://localhost:3000/api';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
/**
 * Sync today's data to the backend
 */
export async function syncToBackend() {
    try {
        // Get stub user ID (in production, this would come from auth)
        const { userId } = await chrome.storage.local.get('userId');
        const stubUserId = userId || 'user_stub_1';
        // Get today's activities
        const today = new Date().toISOString().split('T')[0];
        const key = `centri_activities_${today}`;
        const result = await chrome.storage.local.get(key);
        const activities = result[key] || [];
        if (activities.length === 0) {
            console.log('[Centri] No activities to sync');
            return;
        }
        // Aggregate into summary
        const summary = aggregateDailySummary(activities);
        // Send to backend
        const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: stubUserId,
                summary,
                activities: activities.map(a => ({
                    domain: a.domain,
                    category: a.category,
                    durationSeconds: a.durationSeconds,
                    timestamp: new Date(a.startTime).toISOString()
                }))
            })
        });
        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }
        const data = await response.json();
        console.log('[Centri] Sync successful:', data);
        // Mark as synced
        await chrome.storage.local.set({
            [`${key}_synced`]: true,
            lastSyncTime: Date.now()
        });
    }
    catch (error) {
        console.error('[Centri] Sync error:', error);
    }
}
/**
 * Start periodic sync
 */
export function startPeriodicSync() {
    // Sync immediately
    syncToBackend();
    // Then sync every 5 minutes
    setInterval(() => {
        syncToBackend();
    }, SYNC_INTERVAL);
    console.log('[Centri] Periodic sync started');
}
