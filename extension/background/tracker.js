import { extractDomain, categorizeDomain } from './rules.js';
const INACTIVITY_THRESHOLD = 30 * 1000; // 30 seconds
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
        // Load saved state
        const saved = await chrome.storage.local.get(TRACKER_KEY);
        if (saved[TRACKER_KEY]) {
            this.state = Object.assign(Object.assign({}, this.state), saved[TRACKER_KEY]);
        }
        // Listen to tab changes
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabChange(activeInfo.tabId);
        });
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url && tab.active) {
                this.handleTabChange(tabId);
            }
        });
        // Listen to window focus changes
        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                this.handleWindowBlur();
            }
            else {
                chrome.tabs.query({ active: true, windowId }, (tabs) => {
                    if (tabs[0]) {
                        this.handleTabChange(tabs[0].id);
                    }
                });
            }
        });
        // Listen to idle state
        chrome.idle.onStateChanged.addListener((state) => {
            if (state === 'active') {
                this.handleUserActive();
            }
            else {
                this.handleUserIdle();
            }
        });
        // Listen to activity pings from content script
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'USER_ACTIVITY') {
                this.handleUserActivity();
            }
            else if (message.type === 'TOGGLE_TRACKING') {
                this.togglePause();
            }
        });
        console.log('[Centri] Tracker initialized');
    }
    async handleTabChange(tabId) {
        if (this.state.isPaused)
            return;
        const tab = await chrome.tabs.get(tabId);
        // Skip chrome:// urls and incognito
        if (!tab.url || tab.url.startsWith('chrome://') || tab.incognito) {
            this.stopCurrentActivity();
            return;
        }
        const domain = extractDomain(tab.url);
        // If same domain, don't restart tracking
        if (domain === this.state.currentDomain) {
            return;
        }
        // Save current activity before switching
        await this.stopCurrentActivity();
        // Start new activity
        this.startActivity(domain);
    }
    handleWindowBlur() {
        this.stopCurrentActivity();
    }
    handleUserActive() {
        this.state.isActive = true;
        this.state.lastActivityTime = Date.now();
        this.saveState();
    }
    handleUserIdle() {
        this.state.isActive = false;
        this.stopCurrentActivity();
        this.saveState();
    }
    handleUserActivity() {
        this.state.lastActivityTime = Date.now();
        this.saveState();
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
        // Only save if duration is meaningful (> 5 seconds)
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
        return Object.assign({}, this.state);
    }
}
export const tracker = new ActivityTracker();
