import { prismaNonLogger as prisma } from '@/infrastructure/database/prisma/prisma';
import PosSeeder from '@/infrastructure/database/seeders/pos-seeder';
import RolePermissionSeeder from '@/infrastructure/database/seeders/role-permission-seeder';
import UserSeeder from '@/infrastructure/database/seeders/user-seeder';

async function main() {
  await new RolePermissionSeeder(prisma).execute();
  await new UserSeeder(prisma).execute();
  await new PosSeeder(prisma).execute();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
