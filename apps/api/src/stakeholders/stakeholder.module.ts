import { Module } from '@nestjs/common';
import { StakeholderController } from './stakeholder.controller';
import { StakeholderService } from './stakeholder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [StakeholderController],
    providers: [StakeholderService],
    exports: [StakeholderService]
})
export class StakeholderModule { }
