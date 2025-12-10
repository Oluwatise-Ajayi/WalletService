
import { Module } from '@nestjs/common';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
    imports: [AuthModule],
    controllers: [KeysController],
    providers: [KeysService, PrismaService, ApiKeyGuard],
    exports: [KeysService, ApiKeyGuard],
})
export class KeysModule { }
