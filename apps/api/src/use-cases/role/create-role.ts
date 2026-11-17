import ErrorBadRequest from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import guardSensitivePermissions from '@/use-cases/role/guard-sensitive-permissions';
import { CreateRoleDto } from '@/validations/role-validation';

export default class CreateRole extends BaseUseCase {
  async execute(payload: CreateRoleDto) {
    await guardSensitivePermissions(this.repositories, payload);
    await this.checkUniqueRole(payload);

    return await this.repositories.roleRepository.store(payload);
  }

  private async checkUniqueRole(payload: CreateRoleDto) {
    const countRoles = await this.repositories.roleRepository.count(payload);

    if (countRoles > 0) throw new ErrorBadRequest('Role already exists.');
  }
}
