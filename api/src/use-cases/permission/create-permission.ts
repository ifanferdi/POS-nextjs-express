import { ErrorBadRequest } from '../../helpers/error.helper';
import { CreatePermissionDto } from '../../validations/permission-validation';
import BaseUseCase from '../_base-use-case';

export default class CreatePermission extends BaseUseCase {
  async execute(payload: CreatePermissionDto) {
    await this.checkUniquePermission(payload);

    return await this.repositories.permissionRepository.store(payload);
  }

  private async checkUniquePermission(payload: CreatePermissionDto) {
    const countPermissions = await this.repositories.permissionRepository.count(payload);

    if (countPermissions > 0) throw new ErrorBadRequest('Permission already exists.');
  }
}
