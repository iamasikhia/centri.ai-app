import { Controller, Post, Get, Body, Headers, Req, Res, Query, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService, PRICING_TIERS } from './stripe.service';

@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    /**
     * Get pricing tiers
     */
    @Get('pricing')
    getPricing() {
        return {
            tiers: PRICING_TIERS,
        };
    }

    /**
     * Create a checkout session for subscription
     */
    @Post('checkout')
    async createCheckout(
        @Headers('x-user-id') userId: string,
        @Body() body: { tier: 'pro' | 'team'; successUrl?: string; cancelUrl?: string },
    ) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        const successUrl = body.successUrl || `${baseUrl}/settings/billing?success=true`;
        const cancelUrl = body.cancelUrl || `${baseUrl}/settings/billing?canceled=true`;

        const session = await this.stripeService.createCheckoutSession(
            userId,
            body.tier,
            successUrl,
            cancelUrl,
        );

        return session;
    }

    /**
     * Create a customer portal session
     */
    @Post('portal')
    async createPortal(
        @Headers('x-user-id') userId: string,
        @Body() body: { returnUrl?: string },
    ) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
        const returnUrl = body.returnUrl || `${baseUrl}/settings/billing`;

        return this.stripeService.createPortalSession(userId, returnUrl);
    }

    /**
     * Get current subscription status
     */
    @Get('subscription')
    async getSubscription(@Headers('x-user-id') userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        return this.stripeService.getSubscriptionStatus(userId);
    }

    /**
     * Cancel subscription
     */
    @Post('cancel')
    async cancelSubscription(@Headers('x-user-id') userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        await this.stripeService.cancelSubscription(userId);
        return { success: true, message: 'Subscription will be canceled at the end of the billing period' };
    }

    /**
     * Resume canceled subscription
     */
    @Post('resume')
    async resumeSubscription(@Headers('x-user-id') userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        await this.stripeService.resumeSubscription(userId);
        return { success: true, message: 'Subscription resumed' };
    }

    /**
     * Stripe webhook handler
     * Note: This needs raw body access, configured separately in main.ts
     */
    @Post('webhook')
    async handleWebhook(
        @Req() req: Request,
        @Headers('stripe-signature') signature: string,
    ) {
        // The raw body is attached by the rawBody middleware
        const payload = (req as any).rawBody;

        if (!payload) {
            throw new BadRequestException('No raw body received');
        }

        await this.stripeService.handleWebhook(payload, signature);
        return { received: true };
    }
}
