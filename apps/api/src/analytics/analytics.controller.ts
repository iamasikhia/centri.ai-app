import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('kpis')
    getGlobalKPIs() {
        return this.analyticsService.getGlobalKPIs();
    }

    @Get('usage')
    getFeatureUsage() {
        return this.analyticsService.getFeatureUsage();
    }

    @Get('integrations')
    getIntegrationHealth() {
        return this.analyticsService.getIntegrationHealth();
    }

    @Get('ai')
    getAIIntelligence() {
        return this.analyticsService.getAIIntelligence();
    }

    @Get('reliability')
    getSystemReliability() {
        return this.analyticsService.getSystemReliability();
    }

    @Get('revenue')
    getRevenueMetrics() {
        return this.analyticsService.getRevenueMetrics();
    }
}
