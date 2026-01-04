import { Controller, Post, Req } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post('all')
    async syncAll(@Req() req) {
        const userId = req.headers['x-user-id'] || 'default-user-id';
        return this.syncService.syncAll(userId);
    }
}
