import _ from 'lodash';
import { Seeder } from '../../../domain/infrastructures/database.interface';
import permissionFactory from '../factories/permission-factory';
import RoleFactory from '../factories/role-factory';
import { Permission, PrismaClient } from '../prisma/generated/client';

export default class RolePermissionSeeder implements Seeder {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<void> {
    const permissions = await this.seedPermission();
    await this.seedRole(permissions as Permission[]);
  }

  private async seedRole(permissions: Permission[]) {
    const roles = RoleFactory(permissions);
    await Promise.all(
      roles.map(async (role) =>
        this.prisma.role.create({ data: _.pick(role, 'name') }).then((result) =>
          this.prisma.roleHasPermission.createManyAndReturn({
            data: role.permissionIds!.map((permissionId) => ({ permissionId, roleId: result.id })),
          }),
        ),
      ),
    );
    console.info('✅ Seed Roles');
  }

  private async seedPermission() {
    const permission = await this.prisma.permission.createManyAndReturn({
      data: permissionFactory,
    });

    console.info('✅ Seed Permissions');
    return permission;
  }
}
