
import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaService } from '../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { KeysModule } from '../keys/keys.module';

@Module({
    imports: [ConfigModule, KeysModule],
    controllers: [WalletController],
    providers: [WalletService, PrismaService],
    exports: [WalletService],
})
export class WalletModule { }
