
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async lookupRecipient(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { wallet: true },
        });

        if (!user || !user.wallet) {
            throw new NotFoundException('Recipient not found');
        }

        return {
            valid: true,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            walletId: user.wallet.id,
        };
    }

    async deposit(userId: string, amount: number) {
        if (!userId) throw new BadRequestException('User ID is required');
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const paystackSecret = this.configService.get<string>('paystack.secretKey');
        if (!paystackSecret) {
            throw new Error('Paystack secret key is not configured');
        }

        // Initialize Paystack Transaction
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: user.email,
                amount: amount * 100, // Paystack is in kobo
                metadata: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                },
            },
        );

        // Create a pending transaction record
        await this.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                amount: amount,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.PENDING,
                reference: response.data.data.reference,
                metadata: response.data.data,
            },
        });

        return response.data.data;
    }

    async getDepositStatus(reference: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { reference },
        });

        if (!transaction) throw new NotFoundException('Transaction not found');

        return {
            reference: transaction.reference,
            status: transaction.status,
            amount: transaction.amount,
        };
    }

    async handleWebhook(signature: string, payload: any) {
        const secret = this.configService.get<string>('paystack.secretKey'); // Or WEBHOOK_SECRET
        if (!secret) {
            throw new Error('Paystack secret key is not configured');
        }
        const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

        if (hash !== signature) {
            throw new BadRequestException('Invalid signature');
        }

        const event = payload.event;
        if (event === 'charge.success') {
            const reference = payload.data.reference;

            // Idempotency check & Atomic Update
            await this.prisma.$transaction(async (prisma) => {
                const transaction = await prisma.transaction.findUnique({
                    where: { reference },
                });

                if (!transaction) return; // Should allow manual checks if not found, or log error
                if (transaction.status === TransactionStatus.SUCCESS) return; // Already processed

                // Update Wallet Balance
                await prisma.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: { increment: transaction.amount },
                    },
                });

                // Update Transaction Status
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: TransactionStatus.SUCCESS,
                        metadata: payload, // Update with full success payload
                    },
                });
            });
        }
    }

    async transfer(senderUserId: string, recipientWalletId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        return await this.prisma.$transaction(async (prisma) => {
            // Lock Sender Wallet
            // Note: Prisma doesn't support "SELECT FOR UPDATE" natively in findUnique without raw query or logic extensions.
            // However, atomic update operations (increment/decrement) handle concurrency for the balance field itself.
            // But we need to CHECK balance first. 
            // Pessimistic Locking via raw query is best for high concurrency, 
            // but for "Simple" backend, standard atomic deduction validation is often accepted.
            // Better approach with Prisma: 
            // Update with `where: { balance: { gte: amount } }`. If it fails (RecordNotFound), balance insufficient.

            const senderWallet = await prisma.wallet.findUnique({ where: { userId: senderUserId } });
            if (!senderWallet) throw new NotFoundException('Sender wallet not found');

            // Atomic Deduct with Condition (simulate Check Constraint)
            // functionality: decrement balance ONLY IF balance >= amount
            const updateResult = await prisma.wallet.updateMany({
                where: {
                    id: senderWallet.id,
                    balance: { gte: amount },
                },
                data: {
                    balance: { decrement: amount },
                },
            });

            if (updateResult.count === 0) {
                throw new BadRequestException('Insufficient balance');
            }

            // Add to Recipient
            await prisma.wallet.update({
                where: { id: recipientWalletId }, // Validate recipient exists
                data: {
                    balance: { increment: amount },
                },
            });

            // Record Transactions
            await prisma.transaction.create({
                data: {
                    walletId: senderWallet.id,
                    amount: amount,
                    type: TransactionType.TRANSFER_OUT,
                    status: TransactionStatus.SUCCESS,
                    reference: `TRF-${crypto.randomUUID()}`,
                    description: `Transfer to ${recipientWalletId}`,
                },
            });

            await prisma.transaction.create({
                data: {
                    walletId: recipientWalletId,
                    amount: amount,
                    type: TransactionType.TRANSFER_IN,
                    status: TransactionStatus.SUCCESS,
                    reference: `TRF-IN-${crypto.randomUUID()}`,
                    description: `Transfer from ${senderWallet.id}`,
                },
            });

            return { status: 'success' };
        });
    }

    async getBalance(userId: string) {
        return this.prisma.wallet.findUnique({ where: { userId } });
    }

    async getTransactions(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');

        return this.prisma.transaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            take: 20, // Simple pagination limit
        });
    }
}
