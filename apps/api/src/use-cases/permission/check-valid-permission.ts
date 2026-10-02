import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser } from '@/domain/entities/models/user';
import { Permission } from '@/infrastructure/database/prisma/generated/client';
import BaseUseCase from '@/use-cases/_base-use-case';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import { CheckValidPermissionDto } from '@/validations/permission-validation';

export default class CheckValidPermission extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.redisClient);

  getRedisKey = (userId: number) => `permissions:user-${userId}`;

  async execute({ userId, permissions }: CheckValidPermissionDto) {
    const redisKey = this.getRedisKey(userId);
    let redisData: string[] = await this.repositories.redisRepository.findOne(redisKey);

    if (!redisData) redisData = (await this.saveCachePermissions(userId)) as string[];

    return this.checkRequestPermission(redisData, permissions);
  }

  private checkRequestPermission(redisData: string[], requestPermissions: string | string[]) {
    if (Array.isArray(requestPermissions))
      return requestPermissions.some((perm) => redisData.includes(perm));

    return redisData.includes(requestPermissions);
  }

  private async saveCachePermissions(userId: number) {
    const userPermissions = await this.getUserPermissions(userId);

    // Store permission by user id to redis
    const redisKey = this.getRedisKey(userId);
    await this.repositories.redisRepository.store({ key: redisKey, value: userPermissions });

    return userPermissions;
  }

  private async getUserPermissions(userId: number) {
    const user = (await this.findByIdUser.execute({
      id: userId,
      with: [UserRelation.PERMISSIONS],
    })) as IUser & { permissions: Array<{ permission: Permission }> };
    const permissions = user.permissions.map(({ permission }) => permission.name);

    if (!permissions) return [];

    return permissions;
  }
}
