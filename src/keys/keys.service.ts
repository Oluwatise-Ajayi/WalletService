
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class KeysService {
    constructor(private prisma: PrismaService) { }

    async createKey(userId: string, dto: { name: string; expiry: string; permissions: string[] }) {
        // Check limit (5 keys)
        const count = await this.prisma.apiKey.count({
            where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
        });
        if (count >= 5) throw new BadRequestException('Maximum 5 active keys allowed');

        // Parse Expiry (1H, 1D, 1M, 1Y)
        const expiresAt = this.calculateExpiry(dto.expiry);
        const key = `sk_live_${crypto.randomBytes(16).toString('hex')}`; // Simple generation

        // Store key (should hash in production, but for this task I store generated key to ensure uniqueness check works simply)
        // IMPORTANT: Requirement says "Do not expose secret keys". Usually we show ONCE.
        // If I hash it, I can't show it again. I'll return it now and store the Hash.
        // Wait, if I store Hash, how do I check uniqueness of the generated key? Be careful of collisions (rare).
        // Let's store Hash.
        const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

        await this.prisma.apiKey.create({
            data: {
                userId,
                key: hashedKey, // Storing hash
                name: dto.name,
                permissions: dto.permissions, // Prisma Scalar List
                expiresAt,
            },
        });

        return { api_key: key, expires_at: expiresAt };
    }

    async rollover(userId: string, dto: { expired_key_id: string; expiry: string }) {
        const oldKey = await this.prisma.apiKey.findUnique({
            where: { id: dto.expired_key_id, userId }, // Ensure ownership
        });

        if (!oldKey) throw new NotFoundException('Key not found');

        // Check if truly expired?
        // Requirement: "The expired key must truly be expired."
        // Actually, user might want to rotate BEFORE expiry. But req says "Rollover Expired API Key".
        // Let's enforce expiry check.
        if (oldKey.expiresAt > new Date() && !oldKey.isRevoked) {
            // throw new BadRequestException('Key is not yet expired'); 
            // Allow rollover anyway? "Rollover Expired API Key" suggests strictness.
            // Let's assume strict.
            throw new BadRequestException('Key is active, use Revoke or wait for expiry');
        }

        // Generate New Key
        const expiresAt = this.calculateExpiry(dto.expiry);
        const newKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
        const hashedKey = crypto.createHash('sha256').update(newKey).digest('hex');

        // Transaction? Not strictly needed if just creating new.
        await this.prisma.apiKey.create({
            data: {
                userId,
                key: hashedKey,
                name: oldKey.name + ' (Rollover)',
                permissions: oldKey.permissions, // Reuse permissions
                expiresAt,
            }
        });

        return { api_key: newKey, expires_at: expiresAt };
    }

    private calculateExpiry(duration: string): Date {
        const now = new Date();
        const value = parseInt(duration.slice(0, -1));
        const unit = duration.slice(-1).toUpperCase();

        if (isNaN(value)) throw new BadRequestException('Invalid duration format');

        switch (unit) {
            case 'H': return new Date(now.getTime() + value * 60 * 60 * 1000);
            case 'D': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
            case 'M': return new Date(now.setMonth(now.getMonth() + value)); // Month is tricky, simple add
            case 'Y': return new Date(now.setFullYear(now.getFullYear() + value));
            default: throw new BadRequestException('Invalid duration unit (H, D, M, Y)');
        }
    }

    async validateKey(rawKey: string) {
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

        const keyRecord = await this.prisma.apiKey.findUnique({
            where: { key: hashedKey },
            include: { user: true },
        });

        if (!keyRecord) return null;

        if (keyRecord.isRevoked) {
            throw new BadRequestException('API Key has been revoked');
        }

        if (keyRecord.expiresAt < new Date()) {
            throw new BadRequestException('API Key has expired');
        }

        // Update last used (optional, but good practice)
        // await this.prisma.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } });

        return {
            userId: keyRecord.userId,
            email: keyRecord.user.email,
            permissions: keyRecord.permissions,
        };
    }
}
