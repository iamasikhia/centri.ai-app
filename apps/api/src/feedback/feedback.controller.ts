import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    /**
     * Submit feedback from the main app
     */
    @Post()
    async create(
        @Req() req: any,
        @Body() body: {
            type: string;
            message: string;
            page?: string;
            rating?: number;
        }
    ) {
        const userId = req.headers['x-user-id'] || null;
        const userEmail = req.headers['x-user-email'] || null;
        const userName = req.headers['x-user-name'] || null;

        return this.feedbackService.create({
            userId,
            userEmail,
            userName,
            type: body.type,
            message: body.message,
            page: body.page,
            rating: body.rating,
        });
    }

    /**
     * Get all feedback (admin only)
     */
    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string
    ) {
        return this.feedbackService.findAll({
            status,
            type,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }

    /**
     * Get feedback statistics (admin only)
     */
    @Get('stats')
    async getStats() {
        return this.feedbackService.getStats();
    }

    /**
     * Get a single feedback item
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.feedbackService.findOne(id);
    }

    /**
     * Update feedback status (admin only)
     */
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string; adminNotes?: string }
    ) {
        return this.feedbackService.updateStatus(id, body.status, body.adminNotes);
    }

    /**
     * Delete feedback (admin only)
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.feedbackService.delete(id);
    }
}
