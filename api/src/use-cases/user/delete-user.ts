import { UserRelation } from '../../domain/entities/enums/user.enum';
import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

export default class DeleteUser extends BaseUseCase {
  execute({ id }: BaseFindById, options?: { isPermanently: boolean }) {
    if (options?.isPermanently) {
      return this.handleDeletePermanently({ id });
    }

    return this.repositories.userRepository.destroy(id);
  }

  private async handleDeletePermanently({ id }: BaseFindById) {
    const user = await this.repositories.userRepository.findOne({
      id,
      with: [UserRelation.SOFT_DELETE, UserRelation.PROFILE],
    });
    if (!user) return;

    const deletePermanently = await this.repositories.userRepository.deletePermanently(id);

    if (user.profile?.imagePath)
      await this.repositories.storageRepository?.delete(user.profile.imagePath);

    return deletePermanently;
  }
}
