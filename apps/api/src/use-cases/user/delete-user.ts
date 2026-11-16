import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUserProfile } from '@/domain/entities/models/user';
import { ErrorBadRequest } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteUser extends BaseUseCase {
  async execute({ id }: BaseFindById, options: { isPermanently?: boolean; requestedBy: number }) {
    if (id === options.requestedBy) throw new ErrorBadRequest('Cannot delete yourself.');

    const result = options?.isPermanently
      ? await this.handleDeletePermanently({ id })
      : await this.repositories.userRepository.destroy(id);

    await new ResetCachePermission(this.repositories).execute({ userId: id });

    return result;
  }

  private async handleDeletePermanently({ id }: BaseFindById) {
    const user = await this.repositories.userRepository.findOne<IUserProfile>({
      id,
      with: [UserRelation.SOFT_DELETE, UserRelation.PROFILE],
    });
    if (!user) return;

    const imagePath = user.profile.imagePath;
    const storageRepository = this.repositories.storageRepository;
    if (imagePath && 'validatePath' in storageRepository)
      await storageRepository.validatePath(imagePath);

    const deletePermanently = await this.repositories.userRepository.deletePermanently(id);

    if (imagePath) await storageRepository.delete(imagePath);

    return deletePermanently;
  }
}
