import { USER_FIELD } from '@/domain/entities/models/user';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteRole extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    const affectedUsers = await this.repositories.userRepository.findAll({
      roleId: id,
      limit: -1,
      columns: [USER_FIELD.id],
    });
    const deletedRole = await this.repositories.roleRepository.destroy(id);

    if (deletedRole)
      await new ResetCachePermission(this.repositories).execute({
        userIds: affectedUsers.map((user) => user.id),
      });

    return deletedRole;
  }
}
