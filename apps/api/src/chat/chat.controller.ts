import { Controller, Post, Get, Delete, Body, Headers, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('history')
    async getHistory(@Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';
        return this.chatService.getConversations(uid);
    }

    @Get('history/:id')
    async getConversation(@Param('id') id: string, @Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';
        return this.chatService.getConversationMessages(id, uid);
    }

    @Delete('history/:id')
    async deleteConversation(@Param('id') id: string, @Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';
        return this.chatService.deleteConversation(id, uid);
    }

    @Post()
    async chat(@Body() body: { message: string, conversationId?: string }, @Headers('x-user-id') userId: string) {
        const uid = userId || 'default-user-id';
        return this.chatService.processQuery(uid, body.message, body.conversationId);
    }
}
