/**
 * Subscription tier definitions and feature gating
 */

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface SubscriptionLimits {
    integrations: number; // -1 for unlimited
    meetingsPerMonth: number; // -1 for unlimited
    users: number; // -1 for unlimited
    aiSummaries: boolean;
    codebaseIntelligence: boolean;
    reports: boolean;
    chatCopilot: boolean;
    stakeholderManagement: boolean;
    exports: boolean;
    weeklyBrief: boolean;
    todoCalendarSync: boolean;
    prioritySupport: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        integrations: 1,
        meetingsPerMonth: 5,
        users: 1,
        aiSummaries: false,
        codebaseIntelligence: false,
        reports: false,
        chatCopilot: false,
        stakeholderManagement: false,
        exports: false,
        weeklyBrief: true, // Limited to 1/week
        todoCalendarSync: false,
        prioritySupport: false,
    },
    pro: {
        integrations: -1, // unlimited
        meetingsPerMonth: -1, // unlimited
        users: 1,
        aiSummaries: true,
        codebaseIntelligence: true,
        reports: true,
        chatCopilot: true,
        stakeholderManagement: true,
        exports: true,
        weeklyBrief: true,
        todoCalendarSync: true,
        prioritySupport: true,
    },
    team: {
        integrations: -1,
        meetingsPerMonth: -1,
        users: 5, // Team has multiple users
        aiSummaries: true,
        codebaseIntelligence: true,
        reports: true,
        chatCopilot: true,
        stakeholderManagement: true,
        exports: true,
        weeklyBrief: true,
        todoCalendarSync: true,
        prioritySupport: true,
    },
    enterprise: {
        integrations: -1,
        meetingsPerMonth: -1,
        users: -1, // unlimited
        aiSummaries: true,
        codebaseIntelligence: true,
        reports: true,
        chatCopilot: true,
        stakeholderManagement: true,
        exports: true,
        weeklyBrief: true,
        todoCalendarSync: true,
        prioritySupport: true,
    },
};

/**
 * Check if a feature is available for the given tier
 */
export function hasFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): boolean {
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
    return limits[feature] === true || limits[feature] > 0;
}

/**
 * Get the limit for a specific feature
 */
export function getFeatureLimit(tier: SubscriptionTier, feature: keyof SubscriptionLimits): number | boolean {
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
    return limits[feature];
}

/**
 * Check if a count is within the tier's limit
 */
export function isWithinLimit(tier: SubscriptionTier, feature: keyof SubscriptionLimits, currentCount: number): boolean {
    const limit = getFeatureLimit(tier, feature);
    
    if (typeof limit === 'boolean') {
        return limit;
    }
    
    if (limit === -1) {
        return true; // Unlimited
    }
    
    return currentCount < limit;
}

/**
 * Get remaining quota for a feature
 */
export function getRemainingQuota(tier: SubscriptionTier, feature: keyof SubscriptionLimits, currentCount: number): number | null {
    const limit = getFeatureLimit(tier, feature);
    
    if (typeof limit === 'boolean') {
        return limit ? null : 0; // null means unlimited if true, 0 if false
    }
    
    if (limit === -1) {
        return null; // Unlimited
    }
    
    return Math.max(0, limit - currentCount);
}

/**
 * Get feature access info for UI display
 */
export function getFeatureAccessInfo(tier: SubscriptionTier, feature: keyof SubscriptionLimits, currentCount?: number) {
    const hasAccess = hasFeature(tier, feature);
    const limit = getFeatureLimit(tier, feature);
    const remaining = currentCount !== undefined ? getRemainingQuota(tier, feature, currentCount) : null;
    
    return {
        hasAccess,
        limit,
        remaining,
        isUnlimited: limit === -1 || limit === true,
        canUpgrade: !hasAccess || (typeof limit === 'number' && limit > 0 && limit < Infinity && remaining !== null && remaining < limit * 0.2), // Less than 20% remaining
    };
}

