import {
  RoleAssignPermissionDto,
  SyncByPermissionIdsDto,
  SyncByPermissionsNameDto,
} from '@/validations/role-validation';
import _ from 'lodash';
import BaseUseCase from '../_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';

export default class RoleAssignPermission extends BaseUseCase {
  async execute(payload: RoleAssignPermissionDto) {
    let result: any;

    if (payload.permissions) result = await this.syncByPermissionIds(payload as SyncByPermissionIdsDto);
    else if (payload.permissionIds)
      result = await this.syncByPermissionsName(payload as SyncByPermissionsNameDto);
    else if (payload.addPermissions)
      result = await this.addPermissions(payload as SyncByPermissionsNameDto);
    else if (payload.removePermissions)
      result = await this.removePermissions(payload as SyncByPermissionsNameDto);

    await new ResetCachePermission(this.redisClient).execute({ roleId: payload.roleId });

    return result;
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
