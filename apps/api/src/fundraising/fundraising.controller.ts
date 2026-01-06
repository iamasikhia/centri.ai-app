import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { FundraisingService } from './fundraising.service';

@Controller('fundraising')
export class FundraisingController {
    constructor(private readonly service: FundraisingService) { }

    @Post('save-deep-search')
    async saveDeepSearchResults(
        @Headers('x-user-id') userId: string,
        @Body() body: { opportunities: any[] }
    ) {
        const finalUserId = userId || 'default-user-id';
        return this.service.createMany(finalUserId, body.opportunities);
    }

    @Get()
    async findAll(@Headers('x-user-id') userId: string) {
        return this.service.findAll(userId || 'default-user-id');
    }
}
