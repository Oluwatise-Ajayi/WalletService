const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

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

  // Delete existing keys for this user
  await prisma.apiKey.deleteMany({ where: { userId: user.id } });

  await prisma.apiKey.create({
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
