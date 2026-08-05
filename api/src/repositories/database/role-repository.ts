import _ from 'lodash';
import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import { RoleCreateInput } from '../../infrastructure/database/prisma/generated/models/Role';
import {
  CreateRoleDto,
  FindAllRoleDto,
  FindByIdRoleDto,
  UpdateRoleDto,
} from '../../validations/role-validation';
import DatabaseBaseRepository from './_database-base-repository';

export default class RoleRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllRoleDto, FindByIdRoleDto, CreateRoleDto, UpdateRoleDto>
{
  async findAll(params: Partial<FindAllRoleDto>) {
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

    return this.prisma.role.findMany(query);
  }

  count(params: Partial<FindAllRoleDto>) {
    return this.prisma.role.count({ where: this.queryRoleRepository.handleWhere(params) });
  }

  async findOne(params: FindByIdRoleDto) {
    return this.prisma.role.findFirst({
      where: this.queryRoleRepository.handleWhere(params),
      select: {
        ...this.queryRoleRepository.handleSelect(params?.columns),
        ...this.queryRoleRepository.handleInclude(params?.with),
      },
    });
  }

  async store(data: CreateRoleDto) {
    const payload: RoleCreateInput = _.pick(data, ['name']);
    if (data.permissionIds)
      payload.roleHasPermissions = {
        createMany: { data: data.permissionIds.map((permissionId) => ({ permissionId })) },
      };

    return this.prisma.role.create({ data: payload });
  }

  bulkStore(data: CreateRoleDto[]) {
    return this.prisma.role.createManyAndReturn({ data, skipDuplicates: true });
  }

  update(data: UpdateRoleDto) {
    return this.prisma.role.update({ where: { id: data.id }, data });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array) return this.prisma.role.deleteMany({ where: { id: { in: id } } });
    return this.prisma.role.deleteMany({ where: { id } });
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
