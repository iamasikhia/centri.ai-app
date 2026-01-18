const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAnalytics(endpoint: string) {
    try {
        const res = await fetch(`${API_URL}/analytics/${endpoint}`, {
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                // Add admin secret if you secured the endpoint, currently open
            }
        });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return res.json();
    } catch (e) {
        console.error(`Analytics Error (${endpoint}):`, e);
        // Fallback to prevent crash if API is down
        return null;
    }
}

export async function getGlobalKPIs() {
    const data = await fetchAnalytics('kpis');
    if (data) return data;

    // Fallback to empty (Only if API fails)
    return {
        totalUsers: 0,
        dau: 0,
        mau: 0,
        wau: 0,
        newSignups: 0,
        activeOrgs: 0,
        activationRate: 0,
        churnRate: 0,
        growthRates: { users: 0, dau: 0 }
    };
}

export async function getFeatureUsage() {
    const data = await fetchAnalytics('usage');
    if (data) return data;

    return {
        meetingsProcessed: 0,
        dashboardViews: 0,
        chatConversations: 0,
        aiInteractions: 0,
        tasksCreated: 0,
        stakeholdersTracked: 0
    };
}

export async function getIntegrationHealth() {
    const data = await fetchAnalytics('integrations');
    if (data) return data;

    return {
        totalConnections: 0,
        syncSuccessRate: 0,
        failedSyncs24h: 0,
        breakdown: { google: 0, slack: 0 }
    };
}

export async function getAIIntelligence() {
    const data = await fetchAnalytics('ai');
    if (data) return data;

    return {
        totalRequests: 0,
        totalTokens: 0,
        estimatedCost: 0,
        costPerUser: 0
    };
}

export async function getSystemReliability() {
    const data = await fetchAnalytics('reliability');
    if (data) return data;

    return {
        apiUptime: 0,
        apiLatency: 0,
        errorRate: 0,
        jobFailures: 0,
        pipelineStatus: {
            ai: 'unknown',
            github: 'unknown',
            api: 'unknown',
            slack: 'unknown',
            calendar: 'unknown',
            notifications: 'unknown'
        }
    };
}

export async function getRevenueMetrics() {
    const data = await fetchAnalytics('revenue');
    if (data) return data;

    return {
        mrr: 0,
        arr: 0,
        payingUsers: 0,
        freeUsers: 0,
        newPayingThisMonth: 0,
        churnedUsers: 0,
        arpu: 0,
        subscriptionGrowthRate: 0,
        tierBreakdown: {
            free: 0,
            pro: 0,
            enterprise: 0
        },
        activeSubscriptions: 0,
        totalUsers: 0
    };
}
