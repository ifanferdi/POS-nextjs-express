import { FindByIdPermissionDto } from '@/validations/permission-validation';
import BaseUseCase from '@/use-cases/_base-use-case';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';

export default class DeletePermission extends BaseUseCase {
  async execute({ id }: FindByIdPermissionDto) {
    const deletePermission = await this.repositories.permissionRepository.destroy(id);

    if (deletePermission.count && deletePermission?.count > 0)
      await new ResetCachePermission(this.repositories).execute({ permissionId: id });

    return deletePermission;
  }
}
