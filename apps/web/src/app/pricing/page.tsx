'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Users, Building2, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnterpriseContactModal } from '@/components/enterprise-contact-modal';

const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Discovery Plan - Trial without a credit card. See the magic and hit a paywall fast.',
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
            'No stakeholder management',
            'No exports'
        ],
        cta: 'Get Started',
        highlighted: false,
        icon: Sparkles,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Founder Plan - This replaces Slack digging, GitHub guessing, and meeting chaos.',
        price: 29,
        priceLabel: '$29',
        period: '/month',
        features: [
            'Unlimited integrations',
            'Unlimited meetings',
            'AI meeting summaries',
            'Weekly executive brief',
            'Product intelligence dashboard',
            'Codebase intelligence (non-technical)',
            'Chat copilot',
            'Updates & newsletters',
            'Stakeholder management',
            'Todo + calendar sync',
            'Priority support'
        ],
        cta: 'Start Free Trial',
        highlighted: true,
        icon: Sparkles,
        badge: 'Most Popular',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For big orgs with advanced security and compliance needs.',
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

export default function PricingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
    const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleSelectPlan = async (tierId: string) => {
        if (tierId === 'free') {
            router.push('/dashboard');
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
            console.log('[Pricing] Redirecting to Stripe Payment Link:', STRIPE_PAYMENT_LINK);
            window.location.href = STRIPE_PAYMENT_LINK;
            return;
        }

        // Fallback to API checkout for other tiers (if needed)
        const userId = session?.user?.email || 'default-user-id';

        setLoadingTier(tierId);

        try {
            console.log('[Pricing] Starting checkout for tier:', tierId);
            console.log('[Pricing] API URL:', API_URL);

            const response = await fetch(`${API_URL}/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                },
                body: JSON.stringify({
                    tier: tierId,
                    successUrl: `${window.location.origin}/settings/billing?success=true`,
                    cancelUrl: `${window.location.origin}/pricing?canceled=true`,
                }),
            });

            console.log('[Pricing] Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('[Pricing] API error:', errorData);
                alert(`Checkout failed: ${errorData.message || 'Please try again or contact support.'}`);
                setLoadingTier(null);
                return;
            }

            const data = await response.json();
            console.log('[Pricing] Checkout response:', data);

            if (data.url) {
                console.log('[Pricing] Redirecting to:', data.url);
                window.location.href = data.url;
            } else {
                console.error('[Pricing] No checkout URL received:', data);
                alert('Failed to create checkout session. Please try again or contact support.');
                setLoadingTier(null);
            }
        } catch (error) {
            console.error('[Pricing] Checkout error:', error);
            alert(`Connection error: ${error instanceof Error ? error.message : 'Unable to reach server. Please check if the backend is running.'}`);
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {PRICING_TIERS.map((tier) => {
                        const Icon = tier.icon;
                        const isNoFeature = (feature: string) => feature.toLowerCase().startsWith('no ');
                        
                        return (
                            <Card
                                key={tier.id}
                                className={cn(
                                    "relative flex flex-col transition-all duration-300 hover:shadow-xl",
                                    "h-full border-2",
                                    tier.highlighted
                                        ? "border-primary shadow-2xl scale-[1.03] ring-4 ring-primary/10 bg-primary/5"
                                        : "border-border hover:border-primary/60 hover:shadow-lg"
                                )}
                            >
                                {tier.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={cn(
                                            "p-3 rounded-xl transition-colors",
                                            tier.highlighted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl mb-1">{tier.name}</CardTitle>
                                            <CardDescription className="text-sm leading-relaxed">{tier.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 pb-6">
                                    <div className="mb-8 pb-6 border-b">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold tracking-tight">{getPrice(tier)}</span>
                                            {tier.period && (
                                                <span className="text-muted-foreground text-lg">{tier.period}</span>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-3.5">
                                        {tier.features.map((feature, i) => {
                                            const isNo = isNoFeature(feature);
                                            return (
                                                <li key={i} className="flex items-start gap-3">
                                                    {isNo ? (
                                                        <X className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                    )}
                                                    <span className={cn(
                                                        "text-sm leading-relaxed",
                                                        isNo ? "text-muted-foreground line-through" : "text-foreground"
                                                    )}>
                                                        {isNo ? feature.replace(/^no /i, '') : feature}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>

                                <CardFooter className="pt-0">
                                    <Button
                                        className={cn(
                                            "w-full font-semibold",
                                            tier.highlighted && "shadow-lg hover:shadow-xl"
                                        )}
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

            {/* Enterprise Contact Modal */}
            <EnterpriseContactModal 
                open={enterpriseModalOpen} 
                onOpenChange={setEnterpriseModalOpen} 
            />
        </div>
    );
}
