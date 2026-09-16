import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllRoleDto } from '@/validations/role-validation';

export default class FindAllRole extends BaseUseCase {
  async execute(params: FindAllRoleDto) {
    const { page = 1, limit = 10 } = params;
    const data = await this.repositories.roleRepository.findAll(params);
    const total = await this.repositories.roleRepository.count(params);

    console.log(data[0]);

    return paginate({ page, limit, total, data });
  }
}
