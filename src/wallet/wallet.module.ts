
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaService } from '../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { KeysModule } from '../keys/keys.module';

import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
    imports: [ConfigModule, KeysModule],
    controllers: [WalletController],
    providers: [WalletService, PrismaService, PermissionsGuard],
    exports: [WalletService],
})
export class WalletModule { }
