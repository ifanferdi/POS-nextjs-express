import { Repository } from '@/domain/repositories/database.interface';
import { Prisma, Role } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import {
  RoleCreateInput,
  RoleInclude,
} from '@/infrastructure/database/prisma/generated/models/Role';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import {
  CreateRoleDto,
  FindAllRoleDto,
  FindByIdRoleDto,
  UpdateRoleDto,
} from '@/validations/role-validation';
import _ from 'lodash';

export default class RoleRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllRoleDto, FindByIdRoleDto, CreateRoleDto, UpdateRoleDto>
{
  async findAll<T = Role>(params: Partial<FindAllRoleDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.RoleFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryRoleRepository.handleWhere(params),
      orderBy: this.queryRoleRepository.handleOrderBy(params),
      select: {
        ...this.queryRoleRepository.handleSelect(params?.columns),
        ...this.queryRoleRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.role.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllRoleDto>) {
    return this.prisma.role.count({ where: this.queryRoleRepository.handleWhere(params) });
  }

  async findOne<T = Role>(params: FindByIdRoleDto) {
    return this.prisma.role.findFirst({
      where: this.queryRoleRepository.handleWhere(params),
      select: {
        ...this.queryRoleRepository.handleSelect(params?.columns),
        ...this.queryRoleRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  async store<T = Role>(data: CreateRoleDto) {
    const payload: RoleCreateInput = _.pick(data, ['name']);
    const include: RoleInclude = {};

    if (data.permissionIds) {
      payload.roleHasPermissions = {
        createMany: { data: data.permissionIds.map((permissionId) => ({ permissionId })) },
      };
      include.roleHasPermissions = true;
    }
    return this.prisma.role.create({ data: payload, include }).finally() as Promise<T>;
  }

  bulkStore<T = Role>(data: CreateRoleDto[]) {
    return this.prisma.role.createManyAndReturn({ data, skipDuplicates: true }) as Promise<T[]>;
  }

  update<T = Role>(data: UpdateRoleDto) {
    return this.prisma.role.update({ where: { id: data.id }, data }).finally() as Promise<T>;
  }

  destroy<T = BatchPayload | Role>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.role.deleteMany({ where: { id: { in: id } } }) as Promise<T>;

    return this.prisma.role.delete({ where: { id } }).finally() as Promise<T>;
  }

  syncPermission(roleId: number, permissionIds: number[]) {
    return this.prisma.$transaction(async function (tx) {
      await tx.roleHasPermission.deleteMany({ where: { roleId } });
      await tx.roleHasPermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });
    });
  }

  addPermission(roleId: number, permissionIds: number[]) {
    return this.prisma.roleHasPermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  removePermission(roleId: number, permissionIds: number[]) {
    return this.prisma.roleHasPermission.deleteMany({
      where: { roleId, permissionId: { in: permissionIds } },
    });
  }
}
