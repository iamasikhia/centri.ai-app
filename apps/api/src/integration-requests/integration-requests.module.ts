import { Module } from '@nestjs/common';
import { IntegrationRequestController } from './integration-requests.controller';
import { IntegrationRequestService } from './integration-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IntegrationRequestController],
    providers: [IntegrationRequestService],
    exports: [IntegrationRequestService],
})
export class IntegrationRequestsModule { }
