import { IRole } from '../../domain/entities/models/role';
import paginate from '../../helpers/paginate.helper';
import { FindAllRoleDto } from '../../validations/role-validation';
import BaseUseCase from '../_base-use-case';

export default class FindAllRole extends BaseUseCase {
  async execute(params: FindAllRoleDto) {
    const { page = 1, limit = 10 } = params;
    const data = (await this.repositories.roleRepository.findAll(params)) as IRole[];
    const total = await this.repositories.roleRepository.count(params);

    // extract relation data
    if (params.with?.length) this.extractRelationData(data);

    return paginate({ page, limit, total, data });
  }

  extractRelationData(roles: IRole[]) {
    roles.map((role) => {
      role.permissions = role.roleHasPermissions
        ?.map((rolesHasPermission) => rolesHasPermission.permission)
        .filter((val) => val !== undefined);

      role.roleHasPermissions = undefined;
    });
  }
}
