// Popup UI logic

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

async function updateUI() {
    try {
        // Get today's summary
        const summary = await chrome.runtime.sendMessage({ type: 'GET_TODAY_SUMMARY' });

        const totalTimeEl = document.getElementById('totalTime');
        const activityCountEl = document.getElementById('activityCount');

        if (totalTimeEl && summary) {
            totalTimeEl.textContent = formatTime(summary.totalSeconds);
        }

        if (activityCountEl && summary) {
            const count = summary.activityCount;
            activityCountEl.textContent = `${count} ${count === 1 ? 'activity' : 'activities'} tracked`;
        }

        // Get tracker state
        const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

        const toggleBtn = document.getElementById('toggleBtn');
        const toggleText = document.getElementById('toggleText');

        if (toggleBtn && toggleText && state) {
            if (state.isPaused) {
                toggleBtn.classList.add('paused');
                toggleText.textContent = 'Resume';
            } else {
                toggleBtn.classList.remove('paused');
                toggleText.textContent = 'Pause';
            }
        }
    } catch (error) {
        console.error('Update UI error:', error);
    }
}

// Toggle tracking
document.getElementById('toggleBtn')?.addEventListener('click', async () => {
    try {
        const result = await chrome.runtime.sendMessage({ type: 'TOGGLE_PAUSE' });
        updateUI();
    } catch (error) {
        console.error('Toggle error:', error);
    }
});

// Initial load
updateUI();

// Refresh every 10 seconds
setInterval(updateUI, 10000);
