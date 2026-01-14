export function formatProductReport(data: {
    repo: string;
    explanation?: any;
    tasks?: any[];
    updates?: any[];
    meetings?: any[];
    reportType?: 'product' | 'tasks'; // New parameter
}): string {
    const { repo, explanation, tasks = [], updates = [], meetings = [], reportType = 'product' } = data;

    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate week dates
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEndStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let report = '';

    // --- REPORT HEADER ---
    const title = reportType === 'tasks' ? 'WEEKLY TASK & ACTIVITY REPORT' : 'PRODUCT & ENGINEERING REPORT';
    report += `${title}\n`;
    report += `${repo}\n\n`;
    report += `Week of ${weekStartStr} - ${weekEndStr}\n`;
    report += `Generated: ${date} at ${time}\n\n`;
    report += `${'='.repeat(80)}\n\n`;

    // --- SECTION 1: WEEKLY SUMMARY (Common to both, but slightly tuned names) ---
    if ((updates && updates.length > 0) || (tasks && tasks.length > 0)) {
        report += `WEEKLY SUMMARY\n\n`;

        // Calculate metrics
        const githubUpdates = updates.filter(u => u.source === 'github');
        const activeDevDays = githubUpdates.length > 0 ?
            new Set(githubUpdates.map(u => new Date(u.occurredAt).toDateString())).size : 0;

        const commits = updates.filter(u => u.source === 'github' && u.type === 'github_push').length;
        const prs = updates.filter(u => u.source === 'github' && u.type === 'github_pr').length;
        const releases = updates.filter(u => u.source === 'github' && u.type === 'github_release').length;

        // Task metrics
        const blockers = tasks.filter(t => t.isBlocked).length;
        const activeTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length; // Assuming status available in passed tasks if we query differently, currently query excludes completed in controller - we might need to adjust controller too for "tasks" report to fetch completed ones.

        report += `Activity Metrics:\n`;
        report += `  • Development Days: ${activeDevDays} of 7 days\n`;
        report += `  • Code Commits: ${commits}\n`;
        report += `  • Pull Requests: ${prs}\n`;
        if (releases > 0) report += `  • Releases: ${releases}\n`;
        report += `  • Active Tasks: ${activeTasks}\n`;
        if (blockers > 0) report += `  • ⚠️  Blockers: ${blockers}\n`;
        report += `  • Team Meetings: ${meetings.length}\n\n`;

        // Weekly status calculation (Same logic)
        const velocity = commits + (prs * 2);
        const status = blockers > 2 ? '🔴 BLOCKED - Needs Immediate Attention' :
            velocity > 10 ? '🟢 STRONG - High Velocity' :
                velocity > 5 ? '🟡 GOOD - Steady Progress' :
                    '🟠 SLOW - Low Activity';
        report += `Week Status: ${status}\n\n`;
        report += `${'-'.repeat(80)}\n\n`;
    }

    // --- MODE: PRODUCT REPORT (General codebase focus) ---
    if (reportType === 'product') {
        // Executive Summary
        if (explanation?.executiveSummary) {
            report += `EXECUTIVE SUMMARY\n\n`;
            report += `${explanation.executiveSummary}\n\n`;
            report += `${'-'.repeat(80)}\n\n`;
        }

        // Product Overview
        if (explanation?.productOverview) {
            report += `PRODUCT OVERVIEW\n\n`;
            report += `${explanation.productOverview}\n\n`;
            report += `${'-'.repeat(80)}\n\n`;
        }

        // Architecture (Only for product report)
        if (explanation?.technicalArchitecture) {
            report += `TECHNICAL ARCHITECTURE\n\n`;
            report += `${explanation.technicalArchitecture}\n\n`;
            report += `${'-'.repeat(80)}\n\n`;
        }
    }

    // --- MODE: TASKS REPORT (Execution focus) ---
    if (reportType === 'tasks') {
        // For task report, we emphasize the list of work done and pending
        // We skip high level architecture
    }

    // --- COMMON SECTIONS ---

    // 1. Engineering Updates (Detailed)
    // For "Product" report, we might want this. For "Tasks", definitely want this as "Work Log".
    if (updates && updates.length > 0) {
        const sectionTitle = reportType === 'tasks' ? 'DETAILED WORK LOG (Commits & PRs)' : 'ENGINEERING ACTIVITY THIS WEEK';
        report += `${sectionTitle}\n\n`;
        let updateNum = 1;
        updates.forEach(u => {
            const source = u.source ? u.source.toUpperCase() : 'UNKNOWN';
            report += `${updateNum}. [${source}] ${u.title}\n`;
            if (u.description) {
                report += `   ${u.description}\n`;
            }
            report += `\n`;
            updateNum++;
        });
        report += `${'-'.repeat(80)}\n\n`;
    }

    // 2. Tasks List
    if (tasks && tasks.length > 0) {
        report += `TASK STATUS & BLOCKERS\n\n`;
        let taskNum = 1;
        tasks.forEach(t => {
            const status = t.status ? t.status.toUpperCase() : 'UNKNOWN';
            const blocked = t.isBlocked ? ' [BLOCKED]' : '';
            report += `${taskNum}. ${t.title}\n`;
            report += `   Status: ${status}${blocked}\n`;
            if (t.description) {
                report += `   Details: ${t.description}\n`;
            }
            report += `\n`;
            taskNum++;
        });
        report += `${'-'.repeat(80)}\n\n`;
    }

    // 3. Key Decisions (Relevant for both, maybe less for pure tasks, but context helps)
    if (meetings && meetings.length > 0) {
        report += `STRATEGIC DECISIONS THIS WEEK\n\n`;
        meetings.forEach(m => {
            report += `Meeting: ${m.title}\n`;
            report += `Date: ${new Date(m.createdAt).toLocaleDateString('en-US')}\n\n`;
            try {
                const decisions = JSON.parse(m.decisionsJson);
                if (Array.isArray(decisions) && decisions.length > 0) {
                    report += `Decisions:\n`;
                    decisions.forEach((d, idx) => {
                        report += `  ${idx + 1}. ${d}\n`;
                    });
                }
            } catch (e) { }
            report += `\n`;
        });
        report += `${'-'.repeat(80)}\n\n`;
    }

    // Footer
    report += `END OF REPORT\n`;

    return report;
}
