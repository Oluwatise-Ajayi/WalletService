import { Controller, Post, Body, Get, Req, UseGuards, Headers, BadRequestException, Query, Param, ForbiddenException, UsePipes, ValidationPipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import { Permissions, PermissionsGuard } from '../common/guards/permissions.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { CompositeAuthGuard } from '../common/guards/composite-auth.guard';
import { DepositDto, TransferDto } from './wallet.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('deposit')
    @UseGuards(CompositeAuthGuard)
    @ApiSecurity('JWT-auth')
    @ApiSecurity('API-Key-auth')
    @ApiOperation({ summary: 'Deposit funds into wallet' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async deposit(@Req() req, @Body() body: DepositDto) {
        if (req.user.isService && !req.user.permissions.includes('deposit')) {
            throw new ForbiddenException('Key missing deposit permission');
        }
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
    @UseGuards(UnifiedAuthGuard, PermissionsGuard)
    @Permissions('read', 'transfer')
    @ApiBearerAuth('JWT-auth')
    @ApiSecurity('API-Key-auth')
    @ApiOperation({ summary: 'Lookup recipient by email' })
    async lookupRecipient(@Query('email') email: string) {
        return this.walletService.lookupRecipient(email);
    }

    @Post('transfer')
    @UseGuards(UnifiedAuthGuard, PermissionsGuard)
    @Permissions('transfer')
    @ApiBearerAuth('JWT-auth')
    @ApiSecurity('API-Key-auth')
    @ApiOperation({ summary: 'Transfer funds to another wallet' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async transfer(@Req() req, @Body() body: TransferDto) {
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
    @UseGuards(UnifiedAuthGuard, PermissionsGuard)
    @Permissions('read')
    @ApiBearerAuth('JWT-auth')
    @ApiSecurity('API-Key-auth')
    @ApiOperation({ summary: 'Get wallet balance' })
    async getBalance(@Req() req) {
        return this.walletService.getBalance(req.user.userId);
    }

    @Get('transactions')
    @UseGuards(UnifiedAuthGuard, PermissionsGuard)
    @Permissions('read')
    @ApiBearerAuth('JWT-auth')
    @ApiSecurity('API-Key-auth')
    @ApiOperation({ summary: 'Get transaction history' })
    async getTransactions(@Req() req) {
        return this.walletService.getTransactions(req.user.userId);
    }
}
