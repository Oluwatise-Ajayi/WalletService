
import { Controller, Post, Body, Get, Req, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('deposit')
    @UseGuards(AuthGuard('jwt')) // Or API Key
    async deposit(@Req() req, @Body() body: { amount: number }) {
        return this.walletService.deposit(req.user.userId, body.amount);
    }

    @Post('paystack/webhook')
    async webhook(@Headers('x-paystack-signature') signature: string, @Body() payload: any) {
        if (!signature) throw new BadRequestException('Missing signature');
        return this.walletService.handleWebhook(signature, payload);
    }

    @Post('transfer')
    @UseGuards(AuthGuard('jwt'))
    async transfer(@Req() req, @Body() body: { wallet_number: string; amount: number }) {
        return this.walletService.transfer(req.user.userId, body.wallet_number, body.amount);
    }

    @Get('balance')
    @UseGuards(AuthGuard('jwt'))
    async getBalance(@Req() req) {
        return this.walletService.getBalance(req.user.userId);
    }

    @Get('transactions')
    @UseGuards(AuthGuard('jwt'))
    async getTransactions(@Req() req) {
        return this.walletService.getTransactions(req.user.userId);
    }
}
