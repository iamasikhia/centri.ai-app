import { Module } from '@nestjs/common';
import { ActionItemsController } from './action-items.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ActionItemsController],
})
export class ActionItemsModule { }
