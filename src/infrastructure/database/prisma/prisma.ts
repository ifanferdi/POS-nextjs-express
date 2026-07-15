import { PrismaPg } from '@prisma/adapter-pg';
import { PoolConfig } from 'pg';
import config from '../../../config/config';
import { PrismaClient } from '../prisma/generated/client';

const connectionString = config.database.url;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaOptions: PoolConfig = connectionString
  ? { connectionString }
  : {
      database: config.database.name,
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      ssl: config.database.ssl,
    };

const adapter = new PrismaPg(prismaOptions);
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: config.app.env === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
