import { Controller, Get, Post, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) { }

    @Get()
    async findAll(@Headers('x-user-id') userId: string) {
        if (!userId) throw new UnauthorizedException('User ID required');
        return this.meetingsService.findAll(userId);
    }

    @Get(':id')
    async findOne(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        if (!userId) throw new UnauthorizedException('User ID required');
        return this.meetingsService.findOne(id, userId);
    }

    @Post()
    async create(@Headers('x-user-id') userId: string, @Body() body: { title: string; date: string; transcript: string }) {
        if (!userId) throw new UnauthorizedException('User ID required');
        return this.meetingsService.create(userId, body);
    }

    @Post(':id/analyze')
    async analyze(@Headers('x-user-id') userId: string, @Param('id') id: string) {
        if (!userId) throw new UnauthorizedException('User ID required');
        return this.meetingsService.reanalyze(id, userId);
    }
}
