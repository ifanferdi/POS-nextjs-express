import { PrismaClient } from '@/infrastructure/database/prisma/generated/client';
import QueryPermissionRepository from '@/repositories/database/queries/query-permission-repository';
import QueryRoleRepository from '@/repositories/database/queries/query-role-repository';
import QueryUserRepository from '@/repositories/database/queries/query-user-repository';

export default abstract class DatabaseBaseRepository {
  protected queryUserRepository = new QueryUserRepository();
  protected queryRoleRepository = new QueryRoleRepository();
  protected queryPermissionRepository = new QueryPermissionRepository();

  constructor(protected readonly prisma: PrismaClient) {}
}
