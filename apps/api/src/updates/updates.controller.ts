
import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { UpdatesService } from './updates.service';

@Controller('updates')
export class UpdatesController {
    constructor(private readonly service: UpdatesService) { }

    @Post('refresh')
    refresh(@Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.refreshUpdates(userId);
    }

    @Get()
    findAll(@Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.getUpdates(userId);
    }

    @Get('newsletters')
    findNewsletters(@Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.getNewsletters(userId);
    }

    @Post(':id/read')
    markRead(@Param('id') id: string, @Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.markRead(id, userId);
    }

    @Post(':id/dismiss')
    dismiss(@Param('id') id: string, @Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.dismiss(id, userId);
    }

    @Post('dismiss-all')
    dismissAll(@Req() req: any) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.service.dismissAll(userId);
    }
}
