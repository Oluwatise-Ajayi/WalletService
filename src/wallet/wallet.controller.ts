
import { Controller, Post, Body, Get, Req, UseGuards, Headers, BadRequestException, Query, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import { Permissions } from '../common/guards/permissions.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('deposit')
    @UseGuards(UnifiedAuthGuard)
    @Permissions('deposit')
    @ApiOperation({ summary: 'Deposit funds into wallet' })
    @ApiBody({ schema: { type: 'object', properties: { amount: { type: 'number' } } } })
    async deposit(@Req() req, @Body() body: { amount: number }) {
        console.log('Deposit req.user:', req.user);
        return this.walletService.deposit(req.user.userId, body.amount);
    }

    @Post('paystack/webhook')
    @ApiOperation({ summary: 'Paystack Webhook' })
    async webhook(@Headers('x-paystack-signature') signature: string, @Body() payload: any) {
        if (!signature) throw new BadRequestException('Missing signature');
        return this.walletService.handleWebhook(signature, payload);
    }

    @Get('deposit/:reference/status')
    @ApiOperation({ summary: 'Verify Deposit Status' })
    async verifyDepositStatus(@Param('reference') reference: string) {
        return this.walletService.getDepositStatus(reference);
    }

    @Get('recipient')
    @UseGuards(UnifiedAuthGuard)
    @Permissions('read', 'transfer')
    @ApiOperation({ summary: 'Lookup recipient by email' })
    async lookupRecipient(@Query('email') email: string) {
        return this.walletService.lookupRecipient(email);
    }

    @Post('transfer')
    @UseGuards(UnifiedAuthGuard)
    @Permissions('transfer')
    @ApiOperation({ summary: 'Transfer funds to another wallet' })
    @ApiBody({ schema: { type: 'object', properties: { wallet_number: { type: 'string' }, email: { type: 'string' }, amount: { type: 'number' } } } })
    async transfer(@Req() req, @Body() body: { wallet_number?: string; email?: string; amount: number }) {
        let recipientWalletId = body.wallet_number;

        if (body.email) {
            const recipient = await this.walletService.lookupRecipient(body.email);
            recipientWalletId = recipient.walletId;
        }

        if (!recipientWalletId) {
            throw new BadRequestException('Recipient wallet number or email required');
        }

        return this.walletService.transfer(req.user.userId, recipientWalletId, body.amount);
    }

    @Get('balance')
    @UseGuards(UnifiedAuthGuard)
    @Permissions('read')
    @ApiOperation({ summary: 'Get wallet balance' })
    async getBalance(@Req() req) {
        return this.walletService.getBalance(req.user.userId);
    }

    @Get('transactions')
    @UseGuards(UnifiedAuthGuard)
    @Permissions('read')
    @ApiOperation({ summary: 'Get transaction history' })
    async getTransactions(@Req() req) {
        return this.walletService.getTransactions(req.user.userId);
    }
}
