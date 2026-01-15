import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    async getDashboard(@Req() req, @Query('range') range: string) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.dashboardService.getDashboardData(userId, range);
    }

    @Post('report/generate')
    async generateReport(@Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const report = await this.dashboardService.generateWeekReport(userId);
        return { report };
    }

    @Post('report/export')
    async exportReport(@Req() req, @Body() body: { content: string, title?: string }) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        const url = await this.dashboardService.exportReportToDocs(userId, body.content, body.title);
        return { url };
    }

    /**
     * UNIFIED INTELLIGENCE ENDPOINT
     * Returns cross-source synthesis of Meetings + GitHub + Slack Check-ins
     */
    @Get('intelligence')
    async getUnifiedIntelligence(@Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.dashboardService.getUnifiedIntelligence(userId);
    }
}
