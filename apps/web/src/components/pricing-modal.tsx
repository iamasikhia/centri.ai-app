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
import { Check, Sparkles, Users, Building2, Loader2, X, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Discovery Only - See the magic',
        price: 0,
        priceLabel: '$0',
        period: 'forever',
        features: [
            '1 user',
            '1 integration',
            '5 meetings/month',
            'Basic dashboard',
            'No AI summaries'
        ],
        cta: 'Current Plan',
        highlighted: false,
        icon: Sparkles,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Your core revenue engine',
        price: 29,
        priceLabel: '$29',
        period: '/month',
        features: [
            'Unlimited integrations',
            'Unlimited meetings',
            'AI summaries & insights',
            'Codebase intelligence',
            'Chat copilot',
        ],
        cta: 'Upgrade to Pro',
        highlighted: true,
        icon: Sparkles,
        badge: 'Most Popular',
    },
    {
        id: 'founder',
        name: 'Founder',
        description: 'Limited to first 100 users',
        price: 29,
        priceLabel: '$29',
        period: '/mo (lifetime)',
        features: [
            'Same as Pro',
            'Locked price forever',
            'Early access',
            'Founder community'
        ],
        cta: 'Claim Spot',
        highlighted: false,
        icon: Crown,
        badge: 'Limited Time',
    },
    {
        id: 'team',
        name: 'Team',
        description: 'Scale engine',
        price: 79,
        priceLabel: '$79',
        period: '/user/mo',
        features: [
            'Everything in Pro',
            'Team analytics',
            'Admin controls',
            'SSO & API access',
            'Shared dashboards'
        ],
        cta: 'Upgrade to Team',
        highlighted: false,
        icon: Users,
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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleSelectPlan = async (tierId: string) => {
        if (tierId === 'free' || tierId === currentTier) {
            onOpenChange(false);
            return;
        }

        if (tierId === 'enterprise') {
            window.location.href = 'mailto:sales@centri.ai?subject=Enterprise%20Plan%20Inquiry';
            return;
        }

        if (!session) {
            router.push('/');
            return;
        }

        setLoadingTier(tierId);

        try {
            const response = await fetch(`${API_URL}/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id',
                },
                body: JSON.stringify({
                    tier: tierId,
                    successUrl: `${window.location.origin}/settings/billing?success=true`,
                    cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No checkout URL received');
            }
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PRICING_TIERS.map((tier) => {
                            const Icon = tier.icon;
                            const isCurrentPlan = tier.id === currentTier;

                            return (
                                <div
                                    key={tier.id}
                                    className={cn(
                                        "relative flex flex-col rounded-xl border p-5 transition-all duration-200",
                                        tier.highlighted
                                            ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                                            : "hover:border-primary/40 hover:shadow-md",
                                        isCurrentPlan && "bg-muted/30"
                                    )}
                                >
                                    {tier.badge && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                                {tier.badge}
                                            </span>
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn(
                                            "p-1.5 rounded-lg",
                                            tier.highlighted ? "bg-primary/10" : "bg-muted"
                                        )}>
                                            <Icon className={cn(
                                                "w-4 h-4",
                                                tier.highlighted ? "text-primary" : "text-muted-foreground"
                                            )} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{tier.name}</h3>
                                            <p className="text-xs text-muted-foreground">{tier.description}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">{getPrice(tier)}</span>
                                        {tier.period && (
                                            <span className="text-muted-foreground text-sm ml-1">{tier.period}</span>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-5 flex-1">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                <span className="text-xs">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <Button
                                        className="w-full"
                                        variant={tier.highlighted ? "default" : "outline"}
                                        size="sm"
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
                        <Button variant="outline" size="sm" asChild>
                            <a href="mailto:sales@centri.ai">Contact Sales</a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
