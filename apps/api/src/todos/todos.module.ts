import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from '../encryption/encryption.service';


@Module({
    imports: [PrismaModule],
    controllers: [TodosController],
    providers: [TodosService, EncryptionService],
    exports: [TodosService],
})
export class TodosModule { }
