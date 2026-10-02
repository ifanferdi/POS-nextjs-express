import { Repository } from '@/domain/repositories/database.interface';
import { Permission, Prisma } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import {
  CreatePermissionDto,
  FindAllPermissionDto,
  FindByIdPermissionDto,
  UpdatePermissionDto,
} from '@/validations/permission-validation';

export default class PermissionRepository
  extends DatabaseBaseRepository
  implements
    Repository<
      FindAllPermissionDto,
      FindByIdPermissionDto,
      CreatePermissionDto,
      UpdatePermissionDto
    >
{
  async findAll<T = Permission>(params: Partial<FindAllPermissionDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.PermissionFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryPermissionRepository.handleWhere(params),
      orderBy: this.queryPermissionRepository.handleOrderBy(params),
      select: {
        ...this.queryPermissionRepository.handleSelect(params?.columns),
        ...this.queryPermissionRepository.handleInclude(params),
      },
    };

    return this.prisma.permission.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllPermissionDto>) {
    return this.prisma.permission.count({
      where: this.queryPermissionRepository.handleWhere(params),
    });
  }

  async findOne<T = Permission>(params: FindByIdPermissionDto) {
    return this.prisma.permission.findFirst({
      where: this.queryPermissionRepository.handleWhere(params),
      select: {
        ...this.queryPermissionRepository.handleSelect(params?.columns),
        ...this.queryPermissionRepository.handleInclude(params),
      },
    }) as Promise<T | null>;
  }

  async store<T = Permission>(data: CreatePermissionDto) {
    return this.prisma.permission.create({ data }).finally() as Promise<T>;
  }

  bulkStore<T = Permission>(data: CreatePermissionDto[]) {
    return this.prisma.permission.createManyAndReturn({
      data,
      skipDuplicates: true,
    }) as Promise<T[]>;
  }

  update<T = Permission>(data: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id: data.id }, data }).finally() as Promise<T>;
  }

  destroy<T = BatchPayload | Permission>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.permission.deleteMany({ where: { id: { in: id } } }) as Promise<T>;
    return this.prisma.permission.deleteMany({ where: { id } }) as Promise<T>;
  }
}
