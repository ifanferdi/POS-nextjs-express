import { IUser } from '@/domain/entities/models/user';
import { Repository } from '@/domain/repositories/database.interface';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import {
  UserCreateInput,
  UserInclude,
  UserUpdateInput,
} from '@/infrastructure/database/prisma/generated/models/User';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import {
  CreateUserDto,
  CreateUserProfileDto,
  FindAllUserDto,
  FindOneUserDto,
  UpdateUserDto,
  UpdateUserProfileDto,
} from '@/validations/user-validation';
import _ from 'lodash';

export default class UserRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllUserDto, FindOneUserDto, CreateUserDto, UpdateUserDto>
{
  async findAll<T = IUser>(params: Partial<FindAllUserDto>) {
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

    return this.prisma.user.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllUserDto>) {
    return this.prisma.user.count({ where: this.queryUserRepository.handleWhere(params) });
  }

  async findOne<T = IUser>(params: FindOneUserDto) {
    return this.prisma.user.findFirst({
      where: this.queryUserRepository.handleWhere(params),
      select: {
        ...this.queryUserRepository.handleSelect(params?.columns),
        ...this.queryUserRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  async store<T = IUser>(data: CreateUserProfileDto) {
    const payload: UserCreateInput = _.omit(data, ['profile', 'confirmPassword']);
    const include: UserInclude = {};

    if (data.profile) {
      payload.profile = { create: data.profile };
      include.profile = true;
    }

    return this.prisma.user
      .create({ data: payload, omit: { password: true }, include })
      .finally() as Promise<T>;
  }

  bulkStore<T = IUser>(data: CreateUserDto[]) {
    return this.prisma.user.createManyAndReturn({ data, skipDuplicates: true }) as Promise<T[]>;
  }

  update<T = IUser>(data: UpdateUserProfileDto) {
    const { profile, auth: _, ...rest } = data;
    const payload: UserUpdateInput = rest;
    const include: UserInclude = {};

    if (profile) {
      payload.profile = { upsert: { create: profile, update: profile } };
      include.profile = true;
    }

    return this.prisma.user
      .update({ where: { id: data.id }, data: payload, omit: { password: true }, include })
      .finally() as Promise<T>;
  }

  destroy<T = BatchPayload | IUser>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.user.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: new Date() },
      }) as Promise<T>;

    return this.prisma.user
      .update({ where: { id }, data: { deletedAt: new Date() } })
      .finally() as Promise<T>;
  }

  restore<T = BatchPayload | IUser>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.user.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: null },
      }) as Promise<T>;

    return this.prisma.user
      .update({ where: { id }, data: { deletedAt: null } })
      .finally() as Promise<T>;
  }

  deletePermanently<T = BatchPayload | IUser>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.user.deleteMany({ where: { id: { in: id } } }) as Promise<T>;
    return this.prisma.user.delete({ where: { id } }).finally() as Promise<T>;
  }
}
