import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteRole extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    const deletedRole = await this.repositories.roleRepository.destroy(id);

    if (deletedRole) await new ResetCachePermission(this.repositories).execute({ roleId: id });

    return deletedRole;
  }
}
