import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get chat model preference for a user
   */
  async getChatModel(userId: string) {
    try {
      // Try to find user by email first, then by id
      let user = await this.prisma.user.findUnique({
        where: { email: userId },
        select: { chatModel: true },
      });

      // If not found by email, try by id
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { chatModel: true },
        });
      }

      // If user doesn't exist, return default
      if (!user) {
        return { model: 'openai' };
      }

      return {
        model: (user.chatModel || 'openai') as 'openai' | 'claude',
      };
    } catch (error) {
      console.error('Error getting chat model:', error);
      // Return default on error instead of throwing
      return { model: 'openai' };
    }
  }

  /**
   * Update chat model preference
   */
  async updateChatModel(userId: string, model: 'openai' | 'claude') {
    try {
      console.log(`[ChatSettings] Updating chat model for user: ${userId}, model: ${model}`);
      
      // Try to find user by email first, then by id
      let user = await this.prisma.user.findUnique({
        where: { email: userId },
      });

      console.log(`[ChatSettings] Found user by email: ${!!user}`);

      // If not found by email, try by id
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        console.log(`[ChatSettings] Found user by id: ${!!user}`);
      }

      // If user doesn't exist, create one
      if (!user) {
        console.log(`[ChatSettings] Creating new user for: ${userId}`);
        // For default-user-id, use a real email format
        const email = userId === 'default-user-id' ? 'manager@centri.ai' : userId;
        user = await this.prisma.user.create({
          data: {
            email: email,
            name: 'User',
            chatModel: model,
          },
        });
        console.log(`[ChatSettings] Created user with chatModel: ${user.chatModel}`);
      } else {
        console.log(`[ChatSettings] Updating existing user ${user.id} with chatModel: ${model}`);
        // Update existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { chatModel: model },
        });
        console.log(`[ChatSettings] Updated user with chatModel: ${user.chatModel}`);
      }

      return {
        model: user.chatModel as 'openai' | 'claude',
        updated: true,
      };
    } catch (error) {
      console.error('[ChatSettings] Error updating chat model:', error);
      console.error('[ChatSettings] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new InternalServerErrorException(
        `Failed to update chat model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

