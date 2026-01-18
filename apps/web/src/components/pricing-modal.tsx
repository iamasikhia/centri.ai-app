'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Users, Building2, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnterpriseContactModal } from '@/components/enterprise-contact-modal';

const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Discovery Plan - Trial without a credit card',
        price: 0,
        priceLabel: '$0',
        period: 'forever',
        features: [
            '1 user',
            '1 integration (Google Calendar or Slack)',
            '5 meetings/month',
            '1 weekly product brief',
            'Basic dashboard',
            'No chat copilot',
            'No codebase intelligence',
            'No stakeholder management'
        ],
        cta: 'Get Started',
        highlighted: false,
        icon: Sparkles,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Founder Plan - Replaces Slack digging, GitHub guessing, and meeting chaos',
        price: 29,
        priceLabel: '$29',
        period: '/month',
        features: [
            'Unlimited integrations',
            'Unlimited meetings',
            'AI meeting summaries',
            'Weekly executive brief',
            'Product intelligence dashboard',
            'Codebase intelligence',
            'Chat copilot',
            'Updates & newsletters',
            'Stakeholder management',
            'Todo + calendar sync',
            'Priority support'
        ],
        cta: 'Upgrade to Pro',
        highlighted: true,
        icon: Sparkles,
        badge: 'Most Popular',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For big orgs with advanced security and compliance',
        price: null,
        priceLabel: 'Custom',
        period: '',
        features: [
            'Everything in Pro',
            'SSO (Okta, Azure, Google)',
            'SOC2 compliance',
            'Audit logs',
            'Dedicated support',
            'API access',
            'Custom integrations',
            'Data residency',
            'Onboarding & training'
        ],
        cta: 'Contact Sales',
        highlighted: false,
        icon: Building2,
    },
];

interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTier?: string;
}

export function PricingModal({ open, onOpenChange, currentTier = 'free' }: PricingModalProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
    const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleSelectPlan = async (tierId: string) => {
        if (tierId === 'free' || tierId === currentTier) {
            onOpenChange(false);
            return;
        }

        if (tierId === 'enterprise') {
            setEnterpriseModalOpen(true);
            return;
        }

        // Use Stripe Payment Link for Pro plan
        if (tierId === 'pro') {
            setLoadingTier(tierId);
            // Stripe Payment Link for Pro plan
            const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_28EaEXebR7RJ7Jya7O3oA01';
            console.log('[Pricing Modal] Redirecting to Stripe Payment Link:', STRIPE_PAYMENT_LINK);
            window.location.href = STRIPE_PAYMENT_LINK;
            return;
        }

        // Fallback to API checkout for other tiers (if needed)
        const userId = session?.user?.email || 'default-user-id';

        setLoadingTier(tierId);

        try {
            console.log('[Pricing Modal] Starting checkout for tier:', tierId);
            console.log('[Pricing Modal] API URL:', API_URL);

            const response = await fetch(`${API_URL}/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({
                    tier: tierId,
                    successUrl: `${window.location.origin}/settings/billing?success=true`,
                    cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
                }),
            });

            console.log('[Pricing Modal] Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('[Pricing Modal] API error:', errorData);
                alert(`Checkout failed: ${errorData.message || 'Please try again or contact support.'}`);
                setLoadingTier(null);
                return;
            }

            const data = await response.json();
            console.log('[Pricing Modal] Checkout response:', data);

            if (data.url) {
                console.log('[Pricing Modal] Redirecting to:', data.url);
                window.location.href = data.url;
            } else {
                console.error('[Pricing Modal] No checkout URL received:', data);
                alert('Failed to create checkout session. Please try again or contact support.');
                setLoadingTier(null);
            }
        } catch (error) {
            console.error('[Pricing Modal] Checkout error:', error);
            alert(`Connection error: ${error instanceof Error ? error.message : 'Unable to reach server. Please check if the backend is running on port 3001.'}`);
            setLoadingTier(null);
        }
    };

    const annualDiscount = 0.17;
    const getPrice = (tier: typeof PRICING_TIERS[0]) => {
        if (tier.price === null || tier.price === 0) return tier.priceLabel;
        const price = billingPeriod === 'annual'
            ? Math.round(tier.price * (1 - annualDiscount))
            : tier.price;
        return `$${price}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
                {/* Header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10 px-6 pt-6 pb-4 border-b">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center">
                            Upgrade your plan
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Unlock more features and supercharge your productivity
                        </DialogDescription>
                    </DialogHeader>

                    {/* Billing Toggle */}
                    <div className="flex justify-center mt-4">
                        <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-full">
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                                    billingPeriod === 'monthly'
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingPeriod('annual')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                                    billingPeriod === 'annual'
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Annual
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                    -17%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {PRICING_TIERS.map((tier) => {
                            const Icon = tier.icon;
                            const isCurrentPlan = tier.id === currentTier;
                            const isNoFeature = (feature: string) => feature.toLowerCase().startsWith('no ');

                            return (
                                <div
                                    key={tier.id}
                                    className={cn(
                                        "relative flex flex-col rounded-xl border-2 p-6 transition-all duration-300",
                                        "h-full",
                                        tier.highlighted
                                            ? "border-primary shadow-xl ring-4 ring-primary/10 scale-[1.03] bg-primary/5"
                                            : "border-border hover:border-primary/60 hover:shadow-lg",
                                        isCurrentPlan && "bg-muted/50 border-primary/30"
                                    )}
                                >
                                    {tier.badge && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                {tier.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={cn(
                                            "p-2.5 rounded-lg transition-colors",
                                            tier.highlighted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{tier.description}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6 pb-5 border-b">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold tracking-tight">{getPrice(tier)}</span>
                                            {tier.period && (
                                                <span className="text-muted-foreground text-base">{tier.period}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-6 flex-1">
                                        {tier.features.map((feature, i) => {
                                            const isNo = isNoFeature(feature);
                                            return (
                                                <li key={i} className="flex items-start gap-2.5">
                                                    {isNo ? (
                                                        <X className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                    )}
                                                    <span className={cn(
                                                        "text-xs leading-relaxed",
                                                        isNo ? "text-muted-foreground line-through" : "text-foreground"
                                                    )}>
                                                        {isNo ? feature.replace(/^no /i, '') : feature}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        className={cn(
                                            "w-full font-semibold",
                                            tier.highlighted && "shadow-md hover:shadow-lg"
                                        )}
                                        variant={tier.highlighted ? "default" : "outline"}
                                        size="default"
                                        onClick={() => handleSelectPlan(tier.id)}
                                        disabled={loadingTier === tier.id || isCurrentPlan}
                                    >
                                        {loadingTier === tier.id ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                Loading...
                                            </>
                                        ) : isCurrentPlan ? (
                                            'Current Plan'
                                        ) : (
                                            tier.cta
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Enterprise CTA */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <Building2 className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-medium">Need Enterprise?</h4>
                                <p className="text-xs text-muted-foreground">Custom pricing, dedicated support, and more</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEnterpriseModalOpen(true)}
                        >
                            Contact Sales
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Enterprise Contact Modal */}
            <EnterpriseContactModal 
                open={enterpriseModalOpen} 
                onOpenChange={setEnterpriseModalOpen} 
            />
        </Dialog>
    );
}
