import { Controller, Get, Patch, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { FeaturesService } from './features.service';

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * Get all feature visibility settings (for admin)
   */
  @Get()
  async getAllFeatureFlags() {
    const features = await this.featuresService.getAllFeatures();
    // Convert to FeatureFlag format for admin UI with 'feature-' prefix
    return features.map(f => ({
      key: `feature-${f.featureKey}`,
      enabled: f.enabled,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  /**
   * Get a single feature flag
   */
  @Get(':key')
  async getFeatureFlag(@Param('key') key: string) {
    const enabled = await this.featuresService.isFeatureEnabled(key);
    return { enabled };
  }

  /**
   * Get feature visibility (for main app) - returns array format
   */
  @Get('visibility')
  async getFeatureVisibility() {
    const visibility = await this.featuresService.getFeatureVisibility();
    // Convert to array format for main app
    return Object.entries(visibility).map(([key, enabled]) => ({
      key: `feature-${key}`, // Match the frontend format
      enabled,
    }));
  }

  /**
   * Update a single feature visibility
   */
  @Patch(':key')
  async setFeatureFlag(
    @Param('key') key: string,
    @Body() body: { enabled: boolean },
  ) {
    if (typeof body.enabled !== 'boolean') {
      throw new BadRequestException('enabled must be a boolean');
    }
    // Remove 'feature-' prefix if present
    const featureKey = key.startsWith('feature-') ? key.replace('feature-', '') : key;
    const result = await this.featuresService.updateFeatureVisibility(featureKey, body.enabled);
    // Return in FeatureFlag format with 'feature-' prefix
    return {
      key: `feature-${result.featureKey}`,
      enabled: result.enabled,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * Update multiple feature visibilities (backward compatibility)
   */
  @Put()
  async updateMultipleFeatures(@Body() body: Array<{ featureKey: string; enabled: boolean }>) {
    if (!Array.isArray(body)) {
      throw new BadRequestException('Body must be an array of { featureKey, enabled }');
    }
    return this.featuresService.updateMultipleFeatures(body);
  }
}


