import { ErrorBadRequest } from '../../helpers/error.helper';
import { UpdatePermissionDto } from '../../validations/permission-validation';
import BaseUseCase from '../_base-use-case';
import ResetCachePermission from './reset-cache-permission';

export default class UpdatePermission extends BaseUseCase {
  async execute(payload: UpdatePermissionDto) {
    await this.checkUniquePermission(payload);

    const permission = await this.repositories.permissionRepository.update(payload);

    await new ResetCachePermission(this.repositories).execute({ permissionId: payload.id });

    return permission;
  }

  private async checkUniquePermission(payload: UpdatePermissionDto) {
    const countPermissions = await this.repositories.permissionRepository.count({
      name: payload.name,
      notId: payload.id,
    });

    if (countPermissions > 0) throw new ErrorBadRequest('Permission already exists.');
  }
}
