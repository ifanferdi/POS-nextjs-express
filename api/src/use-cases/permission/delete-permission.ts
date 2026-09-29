import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import { FindByIdPermissionDto } from '@/validations/permission-validation';

export default class DeletePermission extends BaseUseCase {
  async execute({ id }: FindByIdPermissionDto) {
    const deletePermission = await this.repositories.permissionRepository.destroy<BatchPayload>(id);

    if (deletePermission.count && deletePermission?.count > 0)
      await new ResetCachePermission(this.redisClient).execute({ permissionId: id });

    return deletePermission;
  }
}
