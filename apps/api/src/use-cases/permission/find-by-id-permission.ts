import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdPermissionDto } from '@/validations/permission-validation';

export default class FindByIdPermission extends BaseUseCase {
  async execute(params: FindByIdPermissionDto) {
    const permission = await this.repositories.permissionRepository.findOne(params);

    if (!permission) throw new ErrorNotFound('Permission not found.');

    return permission;
  }
}
