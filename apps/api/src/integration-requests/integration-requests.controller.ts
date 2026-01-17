import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { IntegrationRequestService } from './integration-requests.service';

@Controller('integration-requests')
export class IntegrationRequestController {
    constructor(private readonly service: IntegrationRequestService) { }

    /**
     * Submit integration request from the main app
     */
    @Post()
    async create(
        @Req() req: any,
        @Body() body: { integrationIds: string[] }
    ) {
        const userId = req.headers['x-user-id'] || null;
        const userEmail = req.headers['x-user-email'] || null;
        const userName = req.headers['x-user-name'] || null;

        return this.service.create({
            userId,
            userEmail,
            userName,
            integrationIds: body.integrationIds,
        });
    }

    /**
     * Get all integration requests (admin only)
     */
    @Get()
    async findAll(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string
    ) {
        return this.service.findAll({
            status,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }

    /**
     * Get integration request statistics (admin only)
     */
    @Get('stats')
    async getStats() {
        return this.service.getStats();
    }

    /**
     * Get a single integration request
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    /**
     * Update integration request status (admin only)
     */
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string; adminNotes?: string }
    ) {
        return this.service.updateStatus(id, body.status, body.adminNotes);
    }

    /**
     * Delete integration request (admin only)
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
