import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Define all available features in the app
export const AVAILABLE_FEATURES = {
  dashboard: { label: 'Dashboard', description: 'Main dashboard overview' },
  meetings: { label: 'Meetings', description: 'Meeting summaries and transcripts' },
  codebase: { label: 'Codebase Intelligence', description: 'Code analysis and insights' },
  todos: { label: 'Tasks', description: 'Task and todo management' },
  checkins: { label: 'CheckIns', description: 'Slack check-ins and standups' },
  stakeholders: { label: 'Stakeholders', description: 'Stakeholder relationship management' },
  wrapped: { label: 'Work Wrapped', description: 'Work summary and analytics' },
  integrations: { label: 'Integrations', description: 'Integration settings' },
  settings: { label: 'Settings', description: 'User settings' },
} as const;

export type FeatureKey = keyof typeof AVAILABLE_FEATURES;

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all feature visibility settings
   */
  async getAllFeatures() {
    const features = await this.prisma.featureVisibility.findMany({
      orderBy: { label: 'asc' },
    });

    // Ensure all features exist in database
    const existingKeys = new Set(features.map(f => f.featureKey));
    const missingFeatures: typeof features = [];

    for (const [key, config] of Object.entries(AVAILABLE_FEATURES)) {
      if (!existingKeys.has(key)) {
        const created = await this.prisma.featureVisibility.create({
          data: {
            featureKey: key,
            label: config.label,
            description: config.description,
            enabled: true, // Default to enabled
          },
        });
        missingFeatures.push(created);
      }
    }

    return [...features, ...missingFeatures].sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get feature visibility status (for main app)
   */
  async getFeatureVisibility(): Promise<Record<string, boolean>> {
    const features = await this.prisma.featureVisibility.findMany();
    const visibility: Record<string, boolean> = {};

    // Default all features to enabled if not in database
    for (const key of Object.keys(AVAILABLE_FEATURES)) {
      visibility[key] = true;
    }

    // Override with database values
    for (const feature of features) {
      visibility[feature.featureKey] = feature.enabled;
    }

    // Ensure all features exist
    await this.ensureAllFeaturesExist();

    return visibility;
  }

  /**
   * Update feature visibility
   */
  async updateFeatureVisibility(featureKey: string, enabled: boolean) {
    if (!(featureKey in AVAILABLE_FEATURES)) {
      throw new NotFoundException(`Feature ${featureKey} not found`);
    }

    return this.prisma.featureVisibility.upsert({
      where: { featureKey },
      update: { enabled, updatedAt: new Date() },
      create: {
        featureKey,
        label: AVAILABLE_FEATURES[featureKey as FeatureKey].label,
        description: AVAILABLE_FEATURES[featureKey as FeatureKey].description,
        enabled,
      },
    });
  }

  /**
   * Update multiple feature visibilities
   */
  async updateMultipleFeatures(updates: Array<{ featureKey: string; enabled: boolean }>) {
    const results = [];
    for (const update of updates) {
      try {
        const result = await this.updateFeatureVisibility(update.featureKey, update.enabled);
        results.push(result);
      } catch (error) {
        results.push({ error: error.message, featureKey: update.featureKey });
      }
    }
    return results;
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    const feature = await this.prisma.featureVisibility.findUnique({
      where: { featureKey },
    });
    return feature?.enabled ?? true; // Default to enabled if not set
  }

  /**
   * Ensure all features exist in database
   */
  private async ensureAllFeaturesExist() {
    const existing = await this.prisma.featureVisibility.findMany({
      select: { featureKey: true },
    });
    const existingKeys = new Set(existing.map(f => f.featureKey));

    for (const [key, config] of Object.entries(AVAILABLE_FEATURES)) {
      if (!existingKeys.has(key)) {
        await this.prisma.featureVisibility.create({
          data: {
            featureKey: key,
            label: config.label,
            description: config.description,
            enabled: true,
          },
        });
      }
    }
  }
}


