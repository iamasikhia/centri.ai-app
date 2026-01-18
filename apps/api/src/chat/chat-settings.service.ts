import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatSettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get chat model preference for a user
   */
  async getChatModel(userId: string) {
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
  }

  /**
   * Update chat model preference
   */
  async updateChatModel(userId: string, model: 'openai' | 'claude') {
    // Try to find user by email first, then by id
    let user = await this.prisma.user.findUnique({
      where: { email: userId },
    });

    // If not found by email, try by id
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    }

    // If user doesn't exist, create one
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: userId,
          name: 'User',
          chatModel: model,
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { chatModel: model },
      });
    }

    return {
      model: user.chatModel as 'openai' | 'claude',
      updated: true,
    };
  }
}

