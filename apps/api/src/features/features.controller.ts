import { Controller, Get, Put, Body, Param, BadRequestException } from '@nestjs/common';
import { FeaturesService } from './features.service';

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * Get all feature visibility settings (for admin)
   */
  @Get()
  async getAllFeatures() {
    return this.featuresService.getAllFeatures();
  }

  /**
   * Get feature visibility (for main app)
   */
  @Get('visibility')
  async getFeatureVisibility() {
    const visibility = await this.featuresService.getFeatureVisibility();
    return { features: visibility };
  }

  /**
   * Update a single feature visibility
   */
  @Put(':featureKey')
  async updateFeature(
    @Param('featureKey') featureKey: string,
    @Body() body: { enabled: boolean },
  ) {
    if (typeof body.enabled !== 'boolean') {
      throw new BadRequestException('enabled must be a boolean');
    }
    return this.featuresService.updateFeatureVisibility(featureKey, body.enabled);
  }

  /**
   * Update multiple feature visibilities
   */
  @Put()
  async updateMultipleFeatures(@Body() body: Array<{ featureKey: string; enabled: boolean }>) {
    if (!Array.isArray(body)) {
      throw new BadRequestException('Body must be an array of { featureKey, enabled }');
    }
    return this.featuresService.updateMultipleFeatures(body);
  }
}


