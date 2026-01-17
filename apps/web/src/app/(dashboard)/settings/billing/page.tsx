'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CreditCard,
    Check,
    AlertCircle,
    ExternalLink,
    Sparkles,
    Crown,
    Calendar,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PricingModal } from '@/components/pricing-modal';

interface SubscriptionStatus {
    tier: string;
    status: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
}

const TIER_DISPLAY = {
    free: { name: 'Free', color: 'text-muted-foreground', bg: 'bg-muted' },
    pro: { name: 'Pro', color: 'text-primary', bg: 'bg-primary/10' },
    team: { name: 'Team', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    enterprise: { name: 'Enterprise', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: typeof Check }> = {
    active: { label: 'Active', color: 'text-emerald-600', icon: Check },
    trialing: { label: 'Trial', color: 'text-blue-600', icon: Sparkles },
    past_due: { label: 'Past Due', color: 'text-red-600', icon: AlertCircle },
    canceled: { label: 'Canceled', color: 'text-muted-foreground', icon: AlertTriangle },
    free: { label: 'Free Plan', color: 'text-muted-foreground', icon: Check },
};

export default function BillingPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPricingModal, setShowPricingModal] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        // Check for success/canceled params
        if (searchParams.get('success') === 'true') {
            setSuccessMessage('Your subscription has been activated! Welcome to Centri Pro.');
            // Clear the URL params
            window.history.replaceState({}, '', '/settings/billing');
        }
        if (searchParams.get('canceled') === 'true') {
            setSuccessMessage('Checkout was canceled. You can try again anytime.');
            window.history.replaceState({}, '', '/settings/billing');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const response = await fetch(`${API_URL}/stripe/subscription`, {
                headers: { 'x-user-id': 'default-user-id' },
            });
            const data = await response.json();
            setSubscription(data);
        } catch (error) {
            console.error('Error fetching subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setActionLoading('portal');
        try {
            const response = await fetch(`${API_URL}/stripe/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id',
                },
                body: JSON.stringify({
                    returnUrl: `${window.location.origin}/settings/billing`,
                }),
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error opening portal:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
            return;
        }

        setActionLoading('cancel');
        try {
            await fetch(`${API_URL}/stripe/cancel`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' },
            });
            await fetchSubscription();
        } catch (error) {
            console.error('Error canceling subscription:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResumeSubscription = async () => {
        setActionLoading('resume');
        try {
            await fetch(`${API_URL}/stripe/resume`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' },
            });
            await fetchSubscription();
        } catch (error) {
            console.error('Error resuming subscription:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpgrade = () => {
        setShowPricingModal(true);
    };

    const tierInfo = subscription ? TIER_DISPLAY[subscription.tier as keyof typeof TIER_DISPLAY] || TIER_DISPLAY.free : TIER_DISPLAY.free;
    const statusInfo = subscription ? STATUS_DISPLAY[subscription.status] || STATUS_DISPLAY.free : STATUS_DISPLAY.free;
    const StatusIcon = statusInfo.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your subscription and payment methods
                </p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <p className="text-emerald-800 dark:text-emerald-200">{successMessage}</p>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-auto text-emerald-600 hover:text-emerald-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Current Plan
                    </CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : subscription ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={cn(
                                            "text-2xl font-bold",
                                            tierInfo.color
                                        )}>
                                            {tierInfo.name}
                                        </span>
                                        <span className={cn(
                                            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                            statusInfo.color,
                                            subscription.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                subscription.status === 'trialing' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                    subscription.status === 'past_due' ? 'bg-red-100 dark:bg-red-900/30' :
                                                        'bg-muted'
                                        )}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {subscription.cancelAtPeriodEnd && (
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Your subscription will end on {subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy') : 'the end of the billing period'}</span>
                                        </div>
                                    )}

                                    {subscription.trialEndsAt && subscription.status === 'trialing' && (
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>Trial ends on {format(new Date(subscription.trialEndsAt), 'MMMM d, yyyy')}</span>
                                        </div>
                                    )}

                                    {subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && subscription.tier !== 'free' && (
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Renews on {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {subscription.tier === 'free' ? (
                                        <Button onClick={handleUpgrade}>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Upgrade Plan
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={handleManageBilling}
                                                disabled={actionLoading === 'portal'}
                                            >
                                                <CreditCard className="w-4 h-4 mr-2" />
                                                {actionLoading === 'portal' ? 'Loading...' : 'Manage Billing'}
                                                <ExternalLink className="w-3 h-3 ml-2" />
                                            </Button>

                                            {subscription.cancelAtPeriodEnd ? (
                                                <Button
                                                    onClick={handleResumeSubscription}
                                                    disabled={actionLoading === 'resume'}
                                                >
                                                    {actionLoading === 'resume' ? 'Resuming...' : 'Resume Subscription'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={handleCancelSubscription}
                                                    disabled={actionLoading === 'cancel'}
                                                >
                                                    {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Plan'}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">Unable to load subscription information</p>
                            <Button onClick={fetchSubscription} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feature Comparison */}
            {subscription?.tier === 'free' && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="text-primary">Unlock More with Pro</CardTitle>
                        <CardDescription>Get unlimited access to all features</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {[
                                'Unlimited integrations',
                                'Unlimited meeting processing',
                                'AI-powered insights',
                                'Codebase intelligence',
                                'Stakeholder tracking',
                                'Priority support',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleUpgrade} className="w-full md:w-auto">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Upgrade to Pro - $29/month
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Help Section */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">Need help with billing?</h3>
                            <p className="text-sm text-muted-foreground">
                                Contact our support team for any billing questions
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <a href="mailto:billing@centri.ai">Contact Support</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Modal */}
            <PricingModal
                open={showPricingModal}
                onOpenChange={setShowPricingModal}
                currentTier={subscription?.tier || 'free'}
            />
        </div>
    );
}
