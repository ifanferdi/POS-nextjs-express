import { Repositories } from '@/domain/repositories/repositories.interface';
import { getRedisKeyMe } from '@/helpers/common.helper';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import {
  AddPermissionsNameDto,
  RemovePermissionsNameDto,
  RoleAssignPermissionDto,
  SyncByPermissionIdsDto,
  SyncByPermissionsNameDto,
} from '@/validations/role-validation';
import _ from 'lodash';

export default class RoleAssignPermission {
  constructor(private repositories: Repositories) {}

  async execute(payload: RoleAssignPermissionDto) {
    let result: any;

    if (payload.permissions)
      result = await this.syncByPermissionsName(payload as SyncByPermissionsNameDto);
    else if (payload.permissionIds)
      result = await this.syncByPermissionIds(payload as SyncByPermissionIdsDto);
    else if (payload.addPermissions)
      result = await this.addPermissions(payload as AddPermissionsNameDto);
    else if (payload.removePermissions)
      result = await this.removePermissions(payload as RemovePermissionsNameDto);

    await new ResetCachePermission(this.repositories).execute({ roleId: payload.roleId });
    await this.handleResetUserRole(payload.roleId);

    return result;
  }
  async handleResetUserRole(roleId: number) {
    const userIds = await this.repositories.userRepository
      .findAll({ columns: ['id'], limit: -1, roleId })
      .then((users) => users.map((user) => user.id));
    const keys = userIds.map((id) => getRedisKeyMe(id));

    await this.repositories.redisRepository.bulkDestroy(keys);
  }

  async syncByPermissionIds({ roleId, permissionIds }: SyncByPermissionIdsDto) {
    return await this.repositories.roleRepository.syncPermission(roleId, permissionIds);
  }

  async syncByPermissionsName({ roleId, permissions }: SyncByPermissionsNameDto) {
    const permissionIds = await this.getPermissionIds(permissions);
    return await this.syncByPermissionIds({ roleId, permissionIds });
  }

  async addPermissions({ roleId, addPermissions }: AddPermissionsNameDto) {
    let permissionIds = await this.getPermissionIds(addPermissions);

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

  async removePermissions({ roleId, removePermissions }: RemovePermissionsNameDto) {
    let permissionIds = await this.getPermissionIds(removePermissions);
    return this.repositories.roleRepository.removePermission(roleId, permissionIds);
  }

  async getPermissionIds(permissions: string[]) {
    return await this.repositories.permissionRepository
      .findAll({ limit: -1, columns: ['id'], name: permissions })
      .then((permissions) => permissions.map((permission) => permission.id));
  }
}
