
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { CreateApiKeyDto, ApiPermission } from './dto/create-key.dto';

@Injectable()
export class KeysService {
    constructor(private prisma: PrismaService) { }

    // 1. Helper to calculate Expiry Date
    private calculateExpiryDate(expiryString: string): Date {
        const value = parseInt(expiryString.slice(0, -1));
        const unit = expiryString.slice(-1).toUpperCase();
        const date = new Date();

        switch (unit) {
            case 'H': date.setHours(date.getHours() + value); break;
            case 'D': date.setDate(date.getDate() + value); break;
            case 'M': date.setMonth(date.getMonth() + value); break;
            case 'Y': date.setFullYear(date.getFullYear() + value); break;
            default: throw new BadRequestException('Invalid time unit');
        }
        return date;
    }

    // 2. Create Key Method
    async createKey(userId: string, dto: CreateApiKeyDto) {
        // A. Check Limit (Max 5 Active Keys)
        const activeKeysCount = await this.prisma.apiKey.count({
            where: { userId, isRevoked: false, expiresAt: { gt: new Date() } }
        });

        if (activeKeysCount >= 5) {
            throw new ForbiddenException('Limit reached: You can only have 5 active API keys.');
        }

        // B. Generate the Raw Key (This is shown ONCE)
        const rawKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
        const prefix = rawKey.substring(0, 12); // First 12 chars: sk_live_abcd

        // C. Hash it for storage
        const keyHash = await bcrypt.hash(rawKey, 10);

        // D. Mask it for display
        const maskedKey = `${rawKey.substring(0, 12)}...${rawKey.slice(-4)}`;

        // E. Save to DB
        const keyRecord = await this.prisma.apiKey.create({
            data: {
                userId,
                name: dto.name,
                keyHash,      // Store Hash
                maskedKey,    // Store Mask
                prefix,       // Store Prefix for lookup optimization
                permissions: dto.permissions,
                expiresAt: this.calculateExpiryDate(dto.expiry)
            }
        });

        // F. Return RAW key to user (ONLY TIME they see it)
        return {
            api_key: rawKey,
            expires_at: keyRecord.expiresAt,
            permissions: keyRecord.permissions
        };
    }

    // 3. Rollover Logic
    async rollover(userId: string, dto: { expired_key_id: string; expiry: string }) {
        // A. Find the old key (must belong to user)
        const oldKey = await this.prisma.apiKey.findFirst({
            where: { id: dto.expired_key_id, userId }
        });

        if (!oldKey) throw new NotFoundException('Old key not found');

        // B. Check if actually expired (Optional constraint)
        // For strictness, if not expired, maybe allow anyway but revoke old?
        // Let's revoke old one regardless.

        // C. Revoke the old key (if not already)
        if (!oldKey.isRevoked) {
            await this.prisma.apiKey.update({ where: { id: dto.expired_key_id }, data: { isRevoked: true } });
        }

        // D. Create new key with SAME permissions
        return this.createKey(userId, {
            name: `${oldKey.name} (Rollover)`,
            permissions: oldKey.permissions as ApiPermission[], // Inherit permissions
            expiry: dto.expiry
        });
    }

    async revokeKey(userId: string, keyId: string) {
        // Ensure key belongs to user
        const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, userId } });
        if (!key) throw new NotFoundException('Key not found');

        return this.prisma.apiKey.update({
            where: { id: keyId },
            data: { isRevoked: true }
        });
    }

    // Validate Key (Helper for Guard)
    async validateKey(rawKey: string) {
        // 1. Extract Prefix
        // Format: sk_live_xxxxxxxxxxxxxxxxxxxx
        // We stored prefix as first 12 chars (including sk_live_)
        if (!rawKey || rawKey.length < 12) return null;
        const prefix = rawKey.substring(0, 12);

        // 2. Lookup by prefix
        const potentialKeys = await this.prisma.apiKey.findMany({
            where: { prefix, isRevoked: false },
            include: { user: true } // We need user info
        });

        // 3. Verify Hash (bcrypt)
        for (const record of potentialKeys) {
            const isMatch = await bcrypt.compare(rawKey, record.keyHash);
            if (isMatch) {
                // 4. Validate Expiry
                if (record.expiresAt < new Date()) {
                    // Could update DB to mark as revoked/expired if lazily checking?
                    // For now just return null/throw
                    return null; // Expired
                }

                // 5. Return User + Permissions
                return {
                    userId: record.userId,
                    email: record.user.email,
                    permissions: record.permissions,
                    isService: true
                };
            }
        }

        return null;
    }
}
