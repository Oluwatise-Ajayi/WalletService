
import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [KeysController],
    providers: [KeysService, PrismaService],
    exports: [KeysService],
})
export class KeysModule { }
