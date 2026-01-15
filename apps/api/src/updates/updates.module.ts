import { Module } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { UpdatesController } from './updates.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { EmailModule } from '../email/email.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [EmailModule, IntegrationsModule],
    controllers: [UpdatesController],
    providers: [UpdatesService, PrismaService, EncryptionService],
})
export class UpdatesModule { }
