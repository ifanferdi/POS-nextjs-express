import config from '@/config/config';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUserProfile } from '@/domain/entities/models/user';
import { getRedisKeyMe } from '@/helpers/common.helper';
import { handleProfileImageUrl } from '@/helpers/data-extractor';
import { Role } from '@/infrastructure/database/prisma/generated/client';
import BaseUseCase from '@/use-cases/_base-use-case';
import FindByIdUser from '@/use-cases/user/find-by-id-user';

const ME_CACHE_TTL = config.redis.meCacheTtl;

export default class MyAccount extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);

  async execute({ id }: { id: number }) {
    const key = getRedisKeyMe(id);

    const cached = await this.repositories.redisRepository.findOne(key);
    if (cached) {
      await handleProfileImageUrl(this.repositories.storageRepository, cached);
      return cached;
    }

    const user = await this.findByIdUser.execute<
      IUserProfile & { role: Role; permissions: Permissions[] }
    >({
      id,
      with: [UserRelation.PROFILE, UserRelation.ROLE, UserRelation.PERMISSIONS],
    });
    console.log(user);

    user.profile.imageUrl = undefined;

    await this.repositories.redisRepository.store({
      key,
      value: user,
      expired: Number(ME_CACHE_TTL),
      logging: false,
    });

    return user;
  }
}
