import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const email = 'test_user@example.com';
    const api_key_raw = 'sk_live_test_key_12345';
    const api_key_hash = crypto.createHash('sha256').update(api_key_raw).digest('hex');

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                googleId: 'test_google_id',
                firstName: 'Test',
                lastName: 'User',
                wallet: {
                    create: { balance: 10000 }
                }
            }
        });
        console.log('Created User:', user.id);
    } else {
        console.log('User exists:', user.id);
    }

    // Create API Key if not exists
    // First delete old ones for cleanliness
    await prisma.apiKey.deleteMany({ where: { userId: user.id } });

    const key = await prisma.apiKey.create({
        data: {
            userId: user.id,
            name: 'Test Key',
            key: api_key_hash,
            permissions: ['deposit', 'transfer', 'read'],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
        }
    });
    console.log('Created API Key:', api_key_raw);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
