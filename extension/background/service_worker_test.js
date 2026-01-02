// Minimal test service worker - just logs
console.log('[Centri] Test service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Centri] Extension installed');
});

console.log('[Centri] Service worker initialized');
