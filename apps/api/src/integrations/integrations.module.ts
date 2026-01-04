import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { SlackController } from './slack.controller';
import { IntegrationsService } from './integrations.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';

@Module({
    imports: [ConfigModule],
    controllers: [IntegrationsController, SlackController],
    providers: [IntegrationsService, PrismaService, EncryptionService],
    exports: [IntegrationsService],
})
export class IntegrationsModule { }
