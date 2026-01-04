import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { EncryptionService } from '../encryption/encryption.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [IntegrationsModule, ConfigModule],
    controllers: [SyncController],
    providers: [SyncService, PrismaService, EncryptionService],
})
export class SyncModule { }
