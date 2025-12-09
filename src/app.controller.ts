import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
import * as crypto from 'crypto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService
  ) { }

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test/seed')
  async seed() {
    const email = 'test_user@example.com';
    const api_key_raw = 'sk_live_test_key_12345';
    const api_key_hash = crypto.createHash('sha256').update(api_key_raw).digest('hex');

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
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
    }

    await this.prisma.apiKey.deleteMany({ where: { userId: user.id } });

    await this.prisma.apiKey.create({
      data: {
        userId: user.id,
        name: 'Test Key',
        key: api_key_hash,
        permissions: ['deposit', 'transfer', 'read'],
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      }
    });
    return { api_key: api_key_raw, userId: user.id };
  }
}
