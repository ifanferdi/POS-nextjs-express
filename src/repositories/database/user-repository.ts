import _ from 'lodash';
import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  UserCreateInput,
  UserUpdateInput,
} from '../../infrastructure/database/prisma/generated/models/User';
import {
  CreateUserDto,
  CreateUserProfileDto,
  FindAllUserDto,
  FindOneUserDto,
  UpdateUserDto,
  UpdateUserProfileDto,
} from '../../validations/user-validation';
import DatabaseBaseRepository from './_database-base-repository';

export default class UserRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllUserDto, FindOneUserDto, CreateUserDto, UpdateUserDto>
{
  async findAll(params: Partial<FindAllUserDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.UserFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryUserRepository.handleWhere(params),
      orderBy: this.queryUserRepository.handleOrderBy(params),
      select: {
        ...this.queryUserRepository.handleSelect(params?.columns),
        ...this.queryUserRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.user.findMany(query);
  }

  count(params: Partial<FindAllUserDto>) {
    return this.prisma.user.count({ where: this.queryUserRepository.handleWhere(params) });
  }

  async findOne(params: FindOneUserDto) {
    return this.prisma.user.findFirst({
      where: this.queryUserRepository.handleWhere(params),
      select: {
        ...this.queryUserRepository.handleSelect(params?.columns),
        ...this.queryUserRepository.handleInclude(params?.with),
      },
    });
  }

  store(data: CreateUserProfileDto) {
    const payload: UserCreateInput = _.omit(data, ['profile', 'confirmPassword']);

    if (data.profile) payload.profile = { create: data.profile };

    return this.prisma.user.create({ data: payload });
  }

  bulkStore(data: CreateUserDto[]) {
    return this.prisma.user.createManyAndReturn({ data, skipDuplicates: true });
  }

  update(data: UpdateUserProfileDto) {
    const updateData: UserUpdateInput = {
      ..._.omit(data, 'profile', 'auth'),
      profile: { update: data.profile },
    };

    return this.prisma.user.update({ where: { id: data.id }, data: updateData });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.user.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: new Date() },
      });
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.user.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: null },
      });
    return this.prisma.user.update({ where: { id }, data: { deletedAt: null } });
  }

  deletePermanently(id: number | number[]) {
    if (id instanceof Array) return this.prisma.user.deleteMany({ where: { id: { in: id } } });
    return this.prisma.user.deleteMany({ where: { id } });
  }
}
