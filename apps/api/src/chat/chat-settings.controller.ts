import { Controller, Get, Patch, Body, Headers, BadRequestException } from '@nestjs/common';
import { ChatSettingsService } from './chat-settings.service';

@Controller('chat-settings')
export class ChatSettingsController {
  constructor(private readonly chatSettingsService: ChatSettingsService) {}

  /**
   * Get chat model preference for a user
   */
  @Get('model')
  async getChatModel(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.chatSettingsService.getChatModel(userId);
  }

  /**
   * Update chat model preference
   */
  @Patch('model')
  async updateChatModel(
    @Headers('x-user-id') userId: string,
    @Body() body: { model: string },
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    const validModels = ['openai', 'claude'];
    if (!validModels.includes(body.model)) {
      throw new BadRequestException(`Invalid model. Must be one of: ${validModels.join(', ')}`);
    }

    return this.chatSettingsService.updateChatModel(userId, body.model as 'openai' | 'claude');
  }
}

