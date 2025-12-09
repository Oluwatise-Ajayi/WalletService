import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Create a standard PostgreSQL connection pool
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });

    // 2. Create the Prisma Driver Adapter
    const adapter = new PrismaPg(pool);

    // 3. Pass the adapter to the parent constructor
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}