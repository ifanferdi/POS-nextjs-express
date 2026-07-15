import { ErrorBadRequest } from '../../helpers/error.helper';
import { UpdateRoleDto } from '../../validations/role-validation';
import BaseUseCase from '../_base-use-case';
import ResetCachePermission from '../permission/reset-cache-permission';

export default class UpdateRole extends BaseUseCase {
  async execute(payload: UpdateRoleDto) {
    await this.checkUniqueRole(payload);

    const role = await this.repositories.roleRepository.update(payload);

    if (payload.permissions || payload.permissionIds)
      await new ResetCachePermission(this.repositories).execute({ roleId: role.id });

    return role;
  }

  private async checkUniqueRole(payload: UpdateRoleDto) {
    const countRoles = await this.repositories.roleRepository.count({
      name: payload.name,
      notId: payload.id,
    });

    if (countRoles > 0) throw new ErrorBadRequest('Role already exists.');
  }
}
