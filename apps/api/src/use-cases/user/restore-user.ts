import { BaseFindById } from '@/validations/base-validation';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';

export default class RestoreUser extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    const user = await this.repositories.userRepository.restore(id);

    await new ResetCachePermission(this.redisClient).execute({ userId: id });

    return user;
  }
}
