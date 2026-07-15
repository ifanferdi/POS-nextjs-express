import { IPermission } from '../../domain/entities/models/permission';
import paginate from '../../helpers/paginate.helper';
import { FindAllPermissionDto } from '../../validations/permission-validation';
import BaseUseCase from '../_base-use-case';

export default class FindAllPermission extends BaseUseCase {
  async execute(params: FindAllPermissionDto) {
    const { page = 1, limit = 10 } = params;
    const data = await this.repositories.permissionRepository.findAll(params);
    const total = await this.repositories.permissionRepository.count(params);

    // extract relation data
    if (params.with?.length) this.extractRelationData(data);

    return paginate({ page, limit, total, data });
  }

  extractRelationData(permissions: IPermission[]) {
    permissions.map((permission) => {
      permission.roles = permission.roleHasPermissions
        ?.map((rolesHasPermission) => rolesHasPermission.role)
        .filter((val) => val !== undefined);

      permission.roleHasPermissions = undefined;
    });
  }
}
