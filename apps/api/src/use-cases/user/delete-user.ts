import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUserProfile } from '@/domain/entities/models/user';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { assertManagedFileKey } from '@/helpers/managed-file-key';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteUser extends BaseUseCase {
  async execute({ id }: BaseFindById, options: { isPermanently?: boolean; requestedBy: number }) {
    if (id === options.requestedBy) throw new ErrorBadRequest('Cannot delete yourself.');

    const user = await this.repositories.userRepository.findOne<IUserProfile>({
      id,
      with: options?.isPermanently
        ? [UserRelation.SOFT_DELETE, UserRelation.PROFILE]
        : [UserRelation.PROFILE],
    });
    const imagePath = user?.profile?.imagePath;
    if (imagePath !== undefined && imagePath !== null)
      assertManagedFileKey(imagePath, 'profiles');

    const result = options?.isPermanently
      ? user
        ? await this.repositories.userRepository.deletePermanently(id)
        : undefined
      : await this.repositories.userRepository.destroy(id);

    if (options?.isPermanently && imagePath !== undefined && imagePath !== null)
      await this.repositories.storageRepository.delete(imagePath);

    await new ResetCachePermission(this.repositories).execute({ userId: id });

    return result;
  }
}
