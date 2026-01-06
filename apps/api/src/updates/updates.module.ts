
import { Module } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';

@Module({
    controllers: [UpdatesController],
    providers: [UpdatesService, PrismaService, EncryptionService],
})
export class UpdatesModule { }
