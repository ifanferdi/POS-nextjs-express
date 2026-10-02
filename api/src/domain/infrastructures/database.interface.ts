import { PrismaClient } from '@prisma/client/extension';

export interface Seeder {
  execute(prisma: PrismaClient): Promise<void>;
}
