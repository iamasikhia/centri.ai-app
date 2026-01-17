import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

// Pricing tiers configuration
export const PRICING_TIERS = {
    free: {
        name: 'Free',
        description: 'Discovery Only - See the magic',
        price: 0,
        priceId: null,
        features: [
            '1 user',
            '1 integration',
            '5 meetings/month',
            'Basic dashboard',
            'No AI summaries',
            'No codebase intelligence',
            'No chat copilot'
        ],
        limits: {
            integrations: 1,
            meetingsPerMonth: 5,
            users: 1,
            aiSummaries: false,
            codebaseIntelligence: false,
            reports: false,
            chatCopilot: false
        }
    },
    pro: {
        name: 'Pro',
        description: 'Your core revenue engine',
        price: 29,
        priceId: process.env.STRIPE_PRO_PRICE_ID,
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
        limits: {
            integrations: -1, // unlimited
            meetingsPerMonth: -1,
            users: 1,
            aiSummaries: true,
            codebaseIntelligence: true,
            reports: true,
            chatCopilot: true
        }
    },
    founder: {
        name: 'Founder',
        description: 'Limited to first 100 users',
        price: 29,
        priceId: process.env.STRIPE_PRO_PRICE_ID, // Maps to Pro price for now, or use specific FOUNDER_PRICE_ID
        features: [
            'Same as Pro',
            'Locked price forever',
            'Early access to features',
            'Founder community access'
        ],
        limits: {
            integrations: -1,
            meetingsPerMonth: -1,
            users: 1,
            aiSummaries: true,
            codebaseIntelligence: true,
            reports: true,
            chatCopilot: true
        }
    },
    team: {
        name: 'Team',
        description: 'Scale engine',
        price: 79,
        priceId: process.env.STRIPE_TEAM_PRICE_ID,
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
        limits: {
            integrations: -1,
            meetingsPerMonth: -1,
            users: -1,
            aiSummaries: true,
            codebaseIntelligence: true,
            reports: true,
            chatCopilot: true
        }
    },
    enterprise: {
        name: 'Enterprise',
        description: 'For large organizations',
        price: null, // Contact sales
        priceId: null,
        features: [
            'Everything in Team',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantees',
            'On-premise option',
            'Advanced security & compliance'
        ],
        limits: {
            integrations: -1,
            meetingsPerMonth: -1,
            users: -1,
            aiSummaries: true,
            codebaseIntelligence: true,
            reports: true,
            chatCopilot: true
        }
    }
};

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) {
        const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            console.warn('[Stripe] STRIPE_SECRET_KEY not configured. Payment features will be disabled.');
            this.stripe = null as any;
        } else {
            this.stripe = new Stripe(secretKey);
        }
    }

    private ensureStripe() {
        if (!this.stripe) {
            throw new BadRequestException('Stripe is not configured. Please contact support.');
        }
    }

    /**
     * Get or create a Stripe customer for a user
     */
    async getOrCreateCustomer(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        // Create new Stripe customer
        const customer = await this.stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
                userId: user.id,
            },
        });

        // Save to database
        await this.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });

        return customer.id;
    }

    /**
     * Create a Stripe Checkout session for subscription
     */
    async createCheckoutSession(
        userId: string,
        tier: 'pro' | 'team',
        successUrl: string,
        cancelUrl: string,
    ): Promise<{ url: string; sessionId: string }> {
        const tierConfig = PRICING_TIERS[tier];
        if (!tierConfig || !tierConfig.priceId) {
            throw new BadRequestException(`Invalid tier: ${tier}`);
        }

        const customerId = await this.getOrCreateCustomer(userId);

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: tierConfig.priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            subscription_data: {
                trial_period_days: 14, // 14-day free trial
                metadata: {
                    userId,
                    tier,
                },
            },
            metadata: {
                userId,
                tier,
            },
            allow_promotion_codes: true,
        });

        return {
            url: session.url!,
            sessionId: session.id,
        };
    }

    /**
     * Create a Stripe Customer Portal session for subscription management
     */
    async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.stripeCustomerId) {
            throw new BadRequestException('No active subscription found');
        }

        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    /**
     * Handle Stripe webhook events
     */
    async handleWebhook(payload: Buffer, signature: string): Promise<void> {
        const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new BadRequestException('Webhook secret not configured');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            console.error('[Stripe] Webhook signature verification failed:', err.message);
            throw new BadRequestException('Invalid webhook signature');
        }

        console.log(`[Stripe] Received webhook event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            default:
                console.log(`[Stripe] Unhandled event type: ${event.type}`);
        }
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as string;

        if (!userId) {
            console.error('[Stripe] No userId in checkout session metadata');
            return;
        }

        console.log(`[Stripe] Checkout completed for user ${userId}, tier: ${tier}`);

        // Subscription details will be updated via subscription.updated event
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
        const customerId = subscription.customer as string;

        const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.error(`[Stripe] No user found for customer ${customerId}`);
            return;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier = this.getTierFromPriceId(priceId);

        // Cast subscription to any to access properties that may vary between API versions
        const sub = subscription as any;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                subscriptionStatus: subscription.status,
                subscriptionTier: tier,
                subscriptionStartDate: sub.start_date ? new Date(sub.start_date * 1000) : new Date(),
                subscriptionEndDate: sub.current_period_end
                    ? new Date(sub.current_period_end * 1000)
                    : null,
                trialEndsAt: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000)
                    : null,
            },
        });

        console.log(`[Stripe] Updated subscription for user ${user.id}: ${subscription.status}, tier: ${tier}`);
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        const customerId = subscription.customer as string;

        const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) {
            console.error(`[Stripe] No user found for customer ${customerId}`);
            return;
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: 'canceled',
                subscriptionTier: 'free',
                subscriptionEndDate: new Date(),
            },
        });

        console.log(`[Stripe] Subscription canceled for user ${user.id}`);
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;

        const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) return;

        await this.prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'past_due' },
        });

        console.log(`[Stripe] Payment failed for user ${user.id}`);
        // TODO: Send email notification about failed payment
    }

    private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
        const customerId = invoice.customer as string;

        const user = await this.prisma.user.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!user) return;

        // Update status back to active if it was past_due
        if (user.subscriptionStatus === 'past_due') {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { subscriptionStatus: 'active' },
            });
        }

        console.log(`[Stripe] Invoice paid for user ${user.id}`);
    }

    private getTierFromPriceId(priceId: string): string {
        if (priceId === this.config.get('STRIPE_PRO_PRICE_ID')) return 'pro';
        if (priceId === this.config.get('STRIPE_TEAM_PRICE_ID')) return 'team';
        return 'free';
    }

    /**
     * Get user's subscription status
     */
    async getSubscriptionStatus(userId: string): Promise<{
        tier: string;
        status: string;
        currentPeriodEnd: Date | null;
        trialEndsAt: Date | null;
        cancelAtPeriodEnd: boolean;
    }> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        let cancelAtPeriodEnd = false;

        if (user.stripeSubscriptionId) {
            try {
                const subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);
                cancelAtPeriodEnd = subscription.cancel_at_period_end;
            } catch (err) {
                console.error('[Stripe] Error fetching subscription:', err.message);
            }
        }

        return {
            tier: user.subscriptionTier || 'free',
            status: user.subscriptionStatus || 'free',
            currentPeriodEnd: user.subscriptionEndDate,
            trialEndsAt: user.trialEndsAt,
            cancelAtPeriodEnd,
        };
    }

    /**
     * Cancel subscription (at end of billing period)
     */
    async cancelSubscription(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.stripeSubscriptionId) {
            throw new BadRequestException('No active subscription found');
        }

        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        console.log(`[Stripe] Subscription set to cancel at period end for user ${userId}`);
    }

    /**
     * Resume canceled subscription
     */
    async resumeSubscription(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.stripeSubscriptionId) {
            throw new BadRequestException('No subscription found');
        }

        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
            cancel_at_period_end: false,
        });

        console.log(`[Stripe] Subscription resumed for user ${userId}`);
    }

    /**
     * Check if user has access to a feature based on their tier
     */
    async hasFeatureAccess(userId: string, feature: 'unlimited_integrations' | 'unlimited_meetings' | 'ai_insights' | 'codebase_intelligence' | 'team_features'): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return false;

        const tier = user.subscriptionTier || 'free';
        const status = user.subscriptionStatus || 'free';

        // Active subscription check
        const isActive = ['active', 'trialing'].includes(status);
        if (!isActive && tier !== 'free') {
            return false;
        }

        const featureTierMap: Record<string, string[]> = {
            unlimited_integrations: ['pro', 'team', 'enterprise'],
            unlimited_meetings: ['pro', 'team', 'enterprise'],
            ai_insights: ['pro', 'team', 'enterprise'],
            codebase_intelligence: ['pro', 'team', 'enterprise'],
            team_features: ['team', 'enterprise'],
        };

        return featureTierMap[feature]?.includes(tier) ?? false;
    }

    /**
     * Get pricing tiers for display
     */
    getPricingTiers() {
        return PRICING_TIERS;
    }
}
