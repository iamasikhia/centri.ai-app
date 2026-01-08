import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.meeting.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' }
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.meeting.findFirst({
            where: { id, userId }
        });
    }
}
