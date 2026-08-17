import { IPermission } from '@/domain/entities/models/permission';
import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdPermissionDto } from '@/validations/permission-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindByIdPermission extends BaseUseCase {
  async execute(params: FindByIdPermissionDto) {
    const permission = (await this.repositories.permissionRepository.findOne(
      params,
    )) as IPermission;

    if (!permission) throw new ErrorNotFound('Permission not found.');

    return permission;
  }
}
