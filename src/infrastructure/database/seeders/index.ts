import { prisma } from '../prisma/prisma';
import RolePermissionSeeder from './role-permission-seeder';
import UserSeeder from './user-seeder';

async function main() {
  await new RolePermissionSeeder(prisma).execute();
  await new UserSeeder(prisma).execute();
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
