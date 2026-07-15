import { IPermission } from '../../domain/entities/models/permission';
import { ErrorNotFound } from '../../helpers/error.helper';
import { FindByIdPermissionDto } from '../../validations/permission-validation';
import BaseUseCase from '../_base-use-case';
import FindAllPermission from './find-all-permission';

export default class FindByIdPermission extends BaseUseCase {
  async execute(params: FindByIdPermissionDto) {
    const permission = (await this.repositories.permissionRepository.findOne(
      params,
    )) as IPermission;

    if (!permission) throw new ErrorNotFound('Permission not found.');

    // extract relation data
    new FindAllPermission(this.repositories).extractRelationData([permission]);

    return permission;
  }
}
