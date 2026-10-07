import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUserProfile } from '@/domain/entities/models/user';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteUser extends BaseUseCase {
  async execute({ id }: BaseFindById, options?: { isPermanently: boolean }) {
    const result = options?.isPermanently
      ? await this.handleDeletePermanently({ id })
      : await this.repositories.userRepository.destroy(id);

    await new ResetCachePermission(this.redisClient).execute({ userId: id });

    return result;
  }

  private async handleDeletePermanently({ id }: BaseFindById) {
    const user = await this.repositories.userRepository.findOne<IUserProfile>({
      id,
      with: [UserRelation.SOFT_DELETE, UserRelation.PROFILE],
    });
    if (!user) return;

    const deletePermanently = await this.repositories.userRepository.deletePermanently(id);

    if (user.profile.imagePath)
      await this.repositories.storageRepository?.delete(user.profile.imagePath);

    return deletePermanently;
  }
}
