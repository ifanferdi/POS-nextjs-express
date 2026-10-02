import paginate from '@/helpers/paginate.helper';
import { FindAllPermissionDto } from '@/validations/permission-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindAllPermission extends BaseUseCase {
  async execute(params: FindAllPermissionDto) {
    const { page = 1, limit = 10 } = params;
    const data = await this.repositories.permissionRepository.findAll(params);
    const total = await this.repositories.permissionRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}
