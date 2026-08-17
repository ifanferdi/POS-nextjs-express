import { IRole } from '@/domain/entities/models/role';
import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdRoleDto } from '@/validations/role-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindByIdRole extends BaseUseCase {
  async execute(params: FindByIdRoleDto) {
    const role = (await this.repositories.roleRepository.findOne(params)) as IRole;

    if (!role) throw new ErrorNotFound('Role not found.');

    return role;
  }
}
