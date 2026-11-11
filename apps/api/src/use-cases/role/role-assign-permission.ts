import { Repositories } from '@/domain/repositories/repositories.interface';
import { getRedisKeyMe } from '@/helpers/common.helper';
import { ErrorForbidden } from '@/helpers/error.helper';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import {
  AddPermissionsNameDto,
  RemovePermissionsNameDto,
  RoleAssignPermissionDto,
  SyncByPermissionIdsDto,
  SyncByPermissionsNameDto,
} from '@/validations/role-validation';
import _ from 'lodash';

// Permission yang bisa dipakai untuk eskalasi (melihat/mengelola permission lain).
const SENSITIVE_PERMISSIONS = ['Show Permission', 'Manage Permission'];

export default class RoleAssignPermission {
  constructor(private repositories: Repositories) {}

  async execute(payload: RoleAssignPermissionDto) {
    await this.guardSensitivePermissions(payload);

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

  // Cegah eskalasi: hanya Developer (roleId 1) yang boleh menambah Show/Manage
  // Permission ke role mana pun — termasuk role sendiri (admin menjadi
  // superadmin, lihat temuan audit #7).
  private async guardSensitivePermissions(payload: RoleAssignPermissionDto) {
    if (payload.actorRoleId === 1) return;

    const requestedNames = [...(payload.permissions ?? []), ...(payload.addPermissions ?? [])];
    const hasSensitiveByName = requestedNames.some((name) =>
      SENSITIVE_PERMISSIONS.includes(name),
    );

    let hasSensitiveById = false;
    if (payload.permissionIds?.length) {
      const permissions = await this.repositories.permissionRepository.findAll({
        ids: payload.permissionIds,
        columns: ['id', 'name'],
        limit: -1,
      });
      hasSensitiveById = permissions.some((permission) =>
        SENSITIVE_PERMISSIONS.includes(permission.name),
      );
    }

    if (hasSensitiveByName || hasSensitiveById)
      throw new ErrorForbidden(
        'Hanya Developer yang dapat mengelola permission Show/Manage Permission.',
      );
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
