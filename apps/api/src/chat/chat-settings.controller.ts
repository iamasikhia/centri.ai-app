import { Controller, Get, Patch, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ChatSettingsService } from './chat-settings.service';

@Controller('chat-settings')
export class ChatSettingsController {
  private readonly logger = new Logger(ChatSettingsController.name);

  constructor(private readonly chatSettingsService: ChatSettingsService) {}

  /**
   * Get chat model preference for a user
   */
  @Get('model')
  async getChatModel(@Headers('x-user-id') userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      return await this.chatSettingsService.getChatModel(userId);
    } catch (error) {
      this.logger.error(`Error getting chat model for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update chat model preference
   */
  @Patch('model')
  async updateChatModel(
    @Headers('x-user-id') userId: string,
    @Body() body: { model: string },
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      if (!body || !body.model) {
        throw new BadRequestException('Model is required in request body');
      }
      
      const validModels = ['openai', 'claude'];
      if (!validModels.includes(body.model)) {
        throw new BadRequestException(`Invalid model. Must be one of: ${validModels.join(', ')}`);
      }

      return await this.chatSettingsService.updateChatModel(userId, body.model as 'openai' | 'claude');
    } catch (error) {
      this.logger.error(`Error updating chat model for user ${userId}:`, error);
      throw error;
    }
  }
}

