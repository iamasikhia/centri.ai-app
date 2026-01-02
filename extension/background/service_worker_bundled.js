// Combined service worker - all code in one file to avoid module issues

// ===== RULES =====
const CATEGORY_RULES = {
    communication: [
        'gmail.com', 'mail.google.com', 'outlook.com', 'slack.com',
        'discord.com', 'teams.microsoft.com', 'zoom.us', 'meet.google.com',
        'mail.yahoo.com', 'protonmail.com', 'telegram.org', 'whatsapp.com'
    ],
    building: [
        'github.com', 'gitlab.com', 'bitbucket.org', 'replit.com',
        'codesandbox.io', 'stackblitz.com', 'vercel.com', 'netlify.com',
        'figma.com', 'canva.com', 'vscode.dev', 'codepen.io'
    ],
    research: [
        'stackoverflow.com', 'reddit.com', 'news.ycombinator.com',
        'medium.com', 'dev.to', 'youtube.com', 'wikipedia.org',
        'google.com', 'bing.com', 'duckduckgo.com', 'perplexity.ai'
    ],
    meetings: [
        'calendar.google.com', 'calendly.com', 'cal.com',
        'zoom.us/j', 'meet.google.com/j'
    ],
    admin: [
        'notion.so', 'trello.com', 'asana.com', 'monday.com',
        'airtable.com', 'clickup.com', 'linear.app', 'height.app',
        'drive.google.com', 'dropbox.com', 'docs.google.com'
    ]
};

function categorizeDomain(domain) {
    const normalized = domain.toLowerCase();
    for (const [category, domains] of Object.entries(CATEGORY_RULES)) {
        if (domains.some(d => normalized.includes(d))) {
            return category;
        }
    }
    return 'research';
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

// ===== TRACKER =====
const INACTIVITY_THRESHOLD = 30 * 1000;
const TRACKER_KEY = 'centri_tracker_state';

class ActivityTracker {
    constructor() {
        this.state = {
            currentDomain: null,
            currentStartTime: null,
            isActive: false,
            isPaused: false,
            lastActivityTime: Date.now()
        };
    }

    async init() {
        const saved = await chrome.storage.local.get(TRACKER_KEY);
        if (saved[TRACKER_KEY]) {
            this.state = { ...this.state, ...saved[TRACKER_KEY] };
        }

        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabChange(activeInfo.tabId);
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url && tab.active) {
                this.handleTabChange(tabId);
            }
        });

        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                this.stopCurrentActivity();
            } else {
                chrome.tabs.query({ active: true, windowId }, (tabs) => {
                    if (tabs[0]) {
                        this.handleTabChange(tabs[0].id);
                    }
                });
            }
        });

        chrome.idle.onStateChanged.addListener((state) => {
            if (state === 'active') {
                this.state.isActive = true;
                this.state.lastActivityTime = Date.now();
                this.saveState();
            } else {
                this.state.isActive = false;
                this.stopCurrentActivity();
                this.saveState();
            }
        });

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'USER_ACTIVITY') {
                this.state.lastActivityTime = Date.now();
                this.saveState();
            } else if (message.type === 'TOGGLE_TRACKING') {
                this.togglePause();
            }
        });

        console.log('[Centri] Tracker initialized');
    }

    async handleTabChange(tabId) {
        if (this.state.isPaused) return;

        const tab = await chrome.tabs.get(tabId);
        if (!tab.url || tab.url.startsWith('chrome://') || tab.incognito) {
            this.stopCurrentActivity();
            return;
        }

        const domain = extractDomain(tab.url);
        if (domain === this.state.currentDomain) {
            return;
        }

        await this.stopCurrentActivity();
        this.startActivity(domain);
    }

    startActivity(domain) {
        this.state.currentDomain = domain;
        this.state.currentStartTime = Date.now();
        this.state.isActive = true;
        this.saveState();
        console.log('[Centri] Started tracking:', domain);
    }

    async stopCurrentActivity() {
        if (!this.state.currentDomain || !this.state.currentStartTime) {
            return;
        }

        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - this.state.currentStartTime) / 1000);

        if (durationSeconds >= 5) {
            const activity = {
                domain: this.state.currentDomain,
                category: categorizeDomain(this.state.currentDomain),
                startTime: this.state.currentStartTime,
                endTime,
                durationSeconds
            };

            await this.saveActivity(activity);
            console.log('[Centri] Saved activity:', activity);
        }

        this.state.currentDomain = null;
        this.state.currentStartTime = null;
        this.saveState();
    }

    async saveActivity(activity) {
        const today = new Date().toISOString().split('T')[0];
        const key = `centri_activities_${today}`;
        const result = await chrome.storage.local.get(key);
        const activities = result[key] || [];
        activities.push(activity);
        await chrome.storage.local.set({ [key]: activities });
    }

    async saveState() {
        await chrome.storage.local.set({ [TRACKER_KEY]: this.state });
    }

    async togglePause() {
        this.state.isPaused = !this.state.isPaused;
        if (this.state.isPaused) {
            await this.stopCurrentActivity();
        }
        await this.saveState();
        return this.state.isPaused;
    }

    getState() {
        return { ...this.state };
    }
}

const tracker = new ActivityTracker();

// ===== AGGREGATOR =====
function aggregateDailySummary(activities) {
    const categoryTotals = {
        communication: 0,
        building: 0,
        research: 0,
        meetings: 0,
        admin: 0
    };

    const domainMap = new Map();
    let totalActiveSeconds = 0;

    for (const activity of activities) {
        if (categoryTotals[activity.category] !== undefined) {
            categoryTotals[activity.category] += activity.durationSeconds;
        }
        totalActiveSeconds += activity.durationSeconds;
        const existing = domainMap.get(activity.domain) || 0;
        domainMap.set(activity.domain, existing + activity.durationSeconds);
    }

    const topDomains = Array.from(domainMap.entries())
        .map(([domain, seconds]) => ({ domain, seconds }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 5);

    const focusWindow = findLongestFocusWindow(activities);
    const today = new Date().toISOString().split('T')[0];

    return {
        date: today,
        totalActiveSeconds,
        categoryTotals,
        topDomains,
        focusWindow,
        contextSwitchCount: activities.length
    };
}

function findLongestFocusWindow(activities) {
    if (activities.length === 0) return null;

    const sorted = [...activities].sort((a, b) => a.startTime - b.startTime);
    let currentStart = sorted[0].startTime;
    let currentEnd = sorted[0].endTime || sorted[0].startTime;
    let longestStart = currentStart;
    let longestEnd = currentEnd;
    let longestDuration = currentEnd - currentStart;

    const GAP_THRESHOLD = 2 * 60 * 1000;

    for (let i = 1; i < sorted.length; i++) {
        const activity = sorted[i];
        const gap = activity.startTime - currentEnd;

        if (gap <= GAP_THRESHOLD) {
            currentEnd = activity.endTime || activity.startTime;
        } else {
            const duration = currentEnd - currentStart;
            if (duration > longestDuration) {
                longestDuration = duration;
                longestStart = currentStart;
                longestEnd = currentEnd;
            }
            currentStart = activity.startTime;
            currentEnd = activity.endTime || activity.startTime;
        }
    }

    const duration = currentEnd - currentStart;
    if (duration > longestDuration) {
        longestStart = currentStart;
        longestEnd = currentEnd;
    }

    return { start: longestStart, end: longestEnd };
}

// ===== SYNC =====
const API_URL = 'http://localhost:3000/api';
const SYNC_INTERVAL = 5 * 60 * 1000;

async function syncToBackend() {
    try {
        const { userId } = await chrome.storage.local.get('userId');
        const stubUserId = userId || 'user_stub_1';

        const today = new Date().toISOString().split('T')[0];
        const key = `centri_activities_${today}`;
        const result = await chrome.storage.local.get(key);
        const activities = result[key] || [];

        if (activities.length === 0) {
            console.log('[Centri] No activities to sync');
            return;
        }

        const summary = aggregateDailySummary(activities);

        const response = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        await chrome.storage.local.set({
            [`${key}_synced`]: true,
            lastSyncTime: Date.now()
        });
    } catch (error) {
        console.error('[Centri] Sync error:', error);
    }
}

function startPeriodicSync() {
    syncToBackend();
    setInterval(() => syncToBackend(), SYNC_INTERVAL);
    console.log('[Centri] Periodic sync started');
}

// ===== INITIALIZE =====
tracker.init();
startPeriodicSync();

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATE') {
        sendResponse(tracker.getState());
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
