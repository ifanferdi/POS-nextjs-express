import {
  ResetCachePermissionDto,
  ResetCachePermissionSchema,
} from '../../validations/permission-validation';
import BaseUseCase from '../_base-use-case';
import CheckValidPermission from './check-valid-permission';

export default class ResetCachePermission extends BaseUseCase {
  async execute(params: ResetCachePermissionDto) {
    ResetCachePermissionSchema.parse(params);

    const userIds = await this.getUserIds(params);

    for (const userId of userIds) {
      const redisKey = new CheckValidPermission(this.repositories).getRedisKey(userId);

      await this.repositories.redisRepository?.destroy(redisKey);
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
