import { Controller, Get, Post, Headers, Body } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    /**
     * Track user activity (called from frontend)
     */
    @Post('track')
    async trackActivity(
        @Headers('x-user-id') userId: string,
        @Body() body: { activityType?: string; page?: string }
    ) {
        const uid = userId || 'default-user-id';
        const activityType = body.activityType || 'page_view';

        return this.activityService.trackActivity(uid, activityType, {
            page: body.page
        });
    }

    /**
     * Get activity stats (for admin dashboard)
     */
    @Get('stats')
    async getActivityStats() {
        return this.activityService.getActivityStats();
    }
}
