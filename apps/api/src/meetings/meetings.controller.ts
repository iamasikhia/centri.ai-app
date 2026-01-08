import { Controller, Get, Param, Headers, UnauthorizedException } from '@nestjs/common';
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
}
