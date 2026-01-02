import { tracker } from './tracker.js';
import { startPeriodicSync } from './sync.js';
// Initialize extension
tracker.init();
startPeriodicSync();
// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATE') {
        const state = tracker.getState();
        sendResponse(state);
        return true;
    }
    if (message.type === 'TOGGLE_PAUSE') {
        tracker.togglePause().then((isPaused) => {
            sendResponse({ isPaused });
        });
        return true;
    }
    if (message.type === 'GET_TODAY_SUMMARY') {
        getTodaySummary().then(sendResponse);
        return true;
    }
});
async function getTodaySummary() {
    const today = new Date().toISOString().split('T')[0];
    const key = `centri_activities_${today}`;
    const result = await chrome.storage.local.get(key);
    const activities = result[key] || [];
    const totalSeconds = activities.reduce((sum, a) => sum + a.durationSeconds, 0);
    return {
        totalSeconds,
        activityCount: activities.length
    };
}
console.log('[Centri] Service worker running');
