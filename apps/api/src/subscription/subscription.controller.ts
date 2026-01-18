import { Controller, Get, Patch, Body, Headers, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Get current subscription tier for a user
   */
  @Get('tier')
  async getSubscriptionTier(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.subscriptionService.getSubscriptionTier(userId);
  }

  /**
   * Update subscription tier (for testing/admin use)
   */
  @Patch('tier')
  async updateSubscriptionTier(
    @Headers('x-user-id') userId: string,
    @Body() body: { tier: string },
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    const validTiers = ['free', 'pro', 'team', 'enterprise'];
    if (!validTiers.includes(body.tier)) {
      throw new BadRequestException(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
    }

    return this.subscriptionService.updateSubscriptionTier(userId, body.tier as any);
  }
}

