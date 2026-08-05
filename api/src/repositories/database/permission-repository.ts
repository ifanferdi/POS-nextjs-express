import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  CreatePermissionDto,
  FindAllPermissionDto,
  FindByIdPermissionDto,
  UpdatePermissionDto,
} from '../../validations/permission-validation';
import DatabaseBaseRepository from './_database-base-repository';

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
  async findAll(params: Partial<FindAllPermissionDto>) {
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

    return this.prisma.permission.findMany(query);
  }

  count(params: Partial<FindAllPermissionDto>) {
    return this.prisma.permission.count({
      where: this.queryPermissionRepository.handleWhere(params),
    });
  }

  async findOne(params: FindByIdPermissionDto) {
    return this.prisma.permission.findFirst({
      where: this.queryPermissionRepository.handleWhere(params),
      select: {
        ...this.queryPermissionRepository.handleSelect(params?.columns),
        ...this.queryPermissionRepository.handleInclude(params),
      },
    });
  }

  async store(data: CreatePermissionDto | CreatePermissionDto[]) {
    if (Array.isArray(data)) return this.bulkStore(data);
    return this.prisma.permission.create({ data });
  }

  bulkStore(data: CreatePermissionDto[]) {
    return this.prisma.permission.createManyAndReturn({ data, skipDuplicates: true });
  }

  update(data: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id: data.id }, data });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.permission.deleteMany({ where: { id: { in: id } } });
    return this.prisma.permission.deleteMany({ where: { id } });
  }
}
