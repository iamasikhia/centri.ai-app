
import { Controller, Get, Query, Headers, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('wrapped')
    async getWrapped(
        @Headers('x-user-id') userId: string,
        @Query('period') period: 'week' | 'month' | 'year' = 'week'
    ) {
        const uid = userId || 'default-user-id';
        return this.reportsService.getWrapped(uid, period);
    }
}
