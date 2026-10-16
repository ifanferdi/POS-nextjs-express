import { getRedisKeyMe, getRedisKeyPermissions, getRedisKeyRole } from '@/helpers/common.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import {
  ResetCachePermissionDto,
  ResetCachePermissionSchema,
} from '@/validations/permission-validation';

export default class ResetCachePermission extends BaseUseCase {
  async execute(params: ResetCachePermissionDto) {
    ResetCachePermissionSchema.parse(params);

    const userIds = await this.getUserIds(params);

    for (const userId of userIds) {
      const permissionKey = getRedisKeyPermissions(userId);
      const meKey = getRedisKeyMe(userId);
      const roleKey = getRedisKeyRole(userId);

      await this.repositories.redisRepository.destroy(permissionKey);
      await this.repositories.redisRepository.destroy(meKey);
      await this.repositories.redisRepository.destroy(roleKey);
    }
  }

  private async getUserIds(params: ResetCachePermissionDto) {
    if (params.userId) return [params.userId];
    else if (params.roleId) return this.getUserIdsByRoleId(params.roleId);
    else {
      const roles = await this.repositories.roleRepository.findAll({
        permissionId: params.permissionId,
      });
      const roleIds = roles?.map((role) => role.id) ?? [];

      return this.getUserIdsByRoleId(roleIds);
    }
  }

  private async getUserIdsByRoleId(roleId: number | number[]) {
    const params: Record<string, any> = { limit: -1, columns: ['userId'] };
    if (Array.isArray(roleId)) params.roleIds = roleId;
    else params.roleId = roleId;

    const users = await this.repositories.userRepository.findAll({ roleId: params.roleId });

    return users.map((user) => user.id);
  }
}
