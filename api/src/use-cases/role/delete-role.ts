import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';
import ResetCachePermission from '../permission/reset-cache-permission';

export default class DeleteRole extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    const deleteRole = await this.repositories.roleRepository.destroy(id);

    if (deleteRole.count && deleteRole?.count > 0)
      await new ResetCachePermission(this.repositories).execute({ roleId: id });

    return deleteRole;
  }
}
