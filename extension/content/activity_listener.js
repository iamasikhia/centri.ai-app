// Content script that detects user activity (mouse, keyboard, scroll)
// This runs on every page to detect when user is actively engaged
let lastActivityTime = Date.now();
let activityTimer = null;
let isExtensionValid = true;
function sendActivityPing() {
    // Check if extension context is still valid
    if (!isExtensionValid) {
        return;
    }
    try {
        chrome.runtime.sendMessage({ type: 'USER_ACTIVITY' }, (response) => {
            // Check for errors (extension context invalidated)
            if (chrome.runtime.lastError) {
                console.log('[Centri] Extension context invalidated, stopping activity listener');
                isExtensionValid = false;
                // Remove event listeners to stop trying
                cleanup();
            }
        });
        lastActivityTime = Date.now();
    }
    catch (error) {
        console.log('[Centri] Extension context invalidated');
        isExtensionValid = false;
        cleanup();
    }
}
function handleActivity() {
    if (!isExtensionValid) {
        return;
    }
    const now = Date.now();
    // Throttle activity pings to once every 10 seconds
    if (now - lastActivityTime > 10000) {
        sendActivityPing();
    }
    // Reset inactivity timer
    if (activityTimer) {
        clearTimeout(activityTimer);
    }
}
function cleanup() {
    // Remove event listeners when extension context is invalidated
    document.removeEventListener('mousemove', handleActivity);
    document.removeEventListener('keydown', handleActivity);
    document.removeEventListener('scroll', handleActivity);
    document.removeEventListener('click', handleActivity);
}
// Listen to user interactions
document.addEventListener('mousemove', handleActivity, { passive: true });
document.addEventListener('keydown', handleActivity, { passive: true });
document.addEventListener('scroll', handleActivity, { passive: true });
document.addEventListener('click', handleActivity, { passive: true });
// Initial ping
sendActivityPing();
console.log('[Centri] Activity listener active');
