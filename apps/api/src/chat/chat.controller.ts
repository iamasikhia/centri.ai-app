
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Post()
    async chat(@Body() body: { message: string }, @Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';
        return this.chatService.processMessage(uid, body.message);
    }
}
