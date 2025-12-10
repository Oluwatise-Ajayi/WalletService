import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // <--- Using bcrypt to match your Service logic

const prisma = new PrismaClient();

async function main() {
    const email = 'test_user@example.com';
    const api_key_raw = 'sk_live_test_key_12345';

    // 1. Create User
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

    // 2. Prepare API Key Data (Securely)
    // We use bcrypt because that is what your KeysService uses to validate
    const api_key_hash = await bcrypt.hash(api_key_raw, 10);
    const prefix = api_key_raw.substring(0, 12);
    const maskedKey = `${prefix}...${api_key_raw.slice(-4)}`;

    // 3. Clean up old keys
    await prisma.apiKey.deleteMany({ where: { userId: user.id } });

    // 4. Create New Key with NEW Schema fields
    await prisma.apiKey.create({
        data: {
            userId: user.id,
            name: 'Test Key',
            permissions: ['deposit', 'transfer', 'read'],
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day

            // --- NEW FIELDS ---
            keyHash: api_key_hash, // Was 'key'
            prefix: prefix,
            maskedKey: maskedKey,
            // ------------------
        }
    });

    console.log('Created API Key:', api_key_raw);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });