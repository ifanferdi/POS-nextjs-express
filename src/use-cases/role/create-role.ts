import ErrorBadRequest from '../../helpers/error.helper';
import { CreateRoleDto } from '../../validations/role-validation';
import BaseUseCase from '../_base-use-case';

export default class CreateRole extends BaseUseCase {
  async execute(payload: CreateRoleDto) {
    await this.checkUniqueRole(payload);

    return await this.repositories.roleRepository.store(payload);
  }

  private async checkUniqueRole(payload: CreateRoleDto) {
    const countRoles = await this.repositories.roleRepository.count(payload);

    if (countRoles > 0) throw new ErrorBadRequest('Role already exists.');
  }
}
