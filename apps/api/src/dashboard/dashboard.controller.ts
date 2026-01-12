import { Controller, Get, Req, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    async getDashboard(@Req() req, @Query('range') range: string) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.dashboardService.getDashboardData(userId, range);
    }
}
