import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get subscription tier for a user
   */
  async getSubscriptionTier(userId: string) {
    // Try to find user by email first, then by id
    let user = await this.prisma.user.findUnique({
      where: { email: userId },
      select: { subscriptionTier: true },
    });

    // If not found by email, try by id
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true },
      });
    }

    // If user doesn't exist, return default free tier
    if (!user) {
      return { tier: 'free' };
    }

    return {
      tier: (user.subscriptionTier || 'free') as SubscriptionTier,
    };
  }

  /**
   * Update subscription tier (for testing/admin use)
   */
  async updateSubscriptionTier(userId: string, tier: SubscriptionTier) {
    // Try to find user by email first, then by id
    let user = await this.prisma.user.findUnique({
      where: { email: userId },
    });

    // If not found by email, try by id
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    }

    // If user doesn't exist, create one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: userId,
          name: 'Test User',
          subscriptionTier: tier,
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: tier },
      });
    }

    return {
      tier: user.subscriptionTier as SubscriptionTier,
      updated: true,
    };
  }
}

