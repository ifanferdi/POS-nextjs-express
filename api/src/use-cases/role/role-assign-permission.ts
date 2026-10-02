import {
  RoleAssignPermissionDto,
  SyncByPermissionIdsDto,
  SyncByPermissionsNameDto,
} from '@/validations/role-validation';
import _ from 'lodash';
import BaseUseCase from '../_base-use-case';

export default class RoleAssignPermission extends BaseUseCase {
  async execute(payload: RoleAssignPermissionDto) {
    if (payload.permissions)
      return await this.syncByPermissionIds(payload as SyncByPermissionIdsDto);
    if (payload.permissionIds)
      return await this.syncByPermissionsName(payload as SyncByPermissionsNameDto);
    if (payload.addPermissions)
      return await this.addPermissions(payload as SyncByPermissionsNameDto);
    if (payload.removePermissions)
      await this.removePermissions(payload as SyncByPermissionsNameDto);
  }

  async syncByPermissionIds({ roleId, permissionIds }: SyncByPermissionIdsDto) {
    return await this.repositories.roleRepository.syncPermission(roleId, permissionIds);
  }

  async syncByPermissionsName({ roleId, permissions }: SyncByPermissionsNameDto) {
    const permissionIds = await this.getPermissionIds(permissions as string[]);

    return await this.syncByPermissionIds({ roleId, permissionIds });
  }

  async addPermissions({ roleId, permissions }: SyncByPermissionsNameDto) {
    let permissionIds = await this.getPermissionIds(permissions as string[]);

    const checkPivotData = await this.repositories.permissionRepository.findAll({
      roleId: roleId,
      limit: -1,
      columns: ['id'],
    });
    const previousPermissionIds = _.map(checkPivotData, 'id');

    // Remove exist permission from database in payload
    permissionIds = permissionIds.filter(
      (permissionId) => !previousPermissionIds.includes(permissionId),
    );

    if (permissionIds.length > 0)
      return this.repositories.roleRepository.addPermission(roleId, permissionIds);
  }

  async removePermissions({ roleId, permissions }: SyncByPermissionsNameDto) {
    let permissionIds = await this.getPermissionIds(permissions as string[]);
    return this.repositories.roleRepository.removePermission(roleId, permissionIds);
  }

  async getPermissionIds(permissions: string[]) {
    return await this.repositories.permissionRepository
      .findAll({ limit: -1, columns: ['id'], name: permissions })
      .then((res) => res.map((permission) => permission.id));
  }
}
