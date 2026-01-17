'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Users, Building2, Loader2, Crown } from 'lucide-react';
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
            'No AI summaries',
            'No codebase intelligence',
            'No chat copilot'
        ],
        cta: 'Get Started',
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
            'Weekly executive brief',
            'Codebase intelligence',
            'Meeting intelligence',
            'Product updates dashboard',
            'Chat copilot',
            'Priority support'
        ],
        cta: 'Start Free Trial',
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
        period: '/month (lifetime)',
        features: [
            'Same as Pro',
            'Locked price forever',
            'Early access to features',
            'Founder community access'
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
        period: '/user/month',
        features: [
            'Everything in Pro',
            'Shared dashboards',
            'Team analytics',
            'Admin controls',
            'Stakeholder reporting',
            'Org-level integrations',
            'SSO & API access',
            'Role-based access'
        ],
        cta: 'Start Free Trial',
        highlighted: false,
        icon: Users,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: null,
        priceLabel: 'Custom',
        period: '',
        features: [
            'Everything in Team',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantees',
            'On-premise option',
            'Advanced security & compliance'
        ],
        cta: 'Contact Sales',
        highlighted: false,
        icon: Building2,
    },
];

export default function PricingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleSelectPlan = async (tierId: string) => {
        if (tierId === 'free') {
            router.push('/dashboard');
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
                    'x-user-id': 'default-user-id', // Replace with actual user ID
                },
                body: JSON.stringify({
                    tier: tierId,
                    successUrl: `${window.location.origin}/settings/billing?success=true`,
                    cancelUrl: `${window.location.origin}/pricing?canceled=true`,
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

    const annualDiscount = 0.17; // 17% discount for annual
    const getPrice = (tier: typeof PRICING_TIERS[0]) => {
        if (tier.price === null || tier.price === 0) return tier.priceLabel;
        const price = billingPeriod === 'annual'
            ? Math.round(tier.price * (1 - annualDiscount))
            : tier.price;
        return `$${price}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Simple, transparent pricing
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                    Start free and upgrade as you grow. All plans include a 14-day free trial.
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
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
                            "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                            billingPeriod === 'annual'
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Annual
                        <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            Save 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PRICING_TIERS.map((tier) => {
                        const Icon = tier.icon;
                        return (
                            <Card
                                key={tier.id}
                                className={cn(
                                    "relative flex flex-col transition-all duration-300 hover:shadow-lg",
                                    tier.highlighted
                                        ? "border-primary shadow-lg scale-[1.02] ring-2 ring-primary/20"
                                        : "hover:border-primary/40"
                                )}
                            >
                                {tier.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            tier.highlighted ? "bg-primary/10" : "bg-muted"
                                        )}>
                                            <Icon className={cn(
                                                "w-5 h-5",
                                                tier.highlighted ? "text-primary" : "text-muted-foreground"
                                            )} />
                                        </div>
                                        <CardTitle className="text-xl">{tier.name}</CardTitle>
                                    </div>
                                    <CardDescription>{tier.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold">{getPrice(tier)}</span>
                                        {tier.period && (
                                            <span className="text-muted-foreground ml-1">{tier.period}</span>
                                        )}
                                    </div>

                                    <ul className="space-y-3">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={tier.highlighted ? "default" : "outline"}
                                        size="lg"
                                        onClick={() => handleSelectPlan(tier.id)}
                                        disabled={loadingTier === tier.id}
                                    >
                                        {loadingTier === tier.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            tier.cta
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <p className="text-muted-foreground">
                        Questions? Contact us at{' '}
                        <a href="mailto:support@centri.ai" className="text-primary hover:underline">
                            support@centri.ai
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
