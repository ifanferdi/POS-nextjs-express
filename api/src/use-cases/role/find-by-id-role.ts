import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdRoleDto } from '@/validations/role-validation';

export default class FindByIdRole extends BaseUseCase {
  async execute(params: FindByIdRoleDto) {
    const role = await this.repositories.roleRepository.findOne(params);

    if (!role) throw new ErrorNotFound('Role not found.');

    return role;
  }
}
