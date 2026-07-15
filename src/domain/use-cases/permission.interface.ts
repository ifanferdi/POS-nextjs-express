import CheckValidPermission from '../../use-cases/permission/check-valid-permission';
import CreatePermission from '../../use-cases/permission/create-permission';
import DeletePermission from '../../use-cases/permission/delete-permission';
import FindAllPermission from '../../use-cases/permission/find-all-permission';
import FindByIdPermission from '../../use-cases/permission/find-by-id-permission';
import ResetCachePermission from '../../use-cases/permission/reset-cache-permission';
import UpdatePermission from '../../use-cases/permission/update-permission';

export interface PermissionUseCase {
  findAllPermission: FindAllPermission;
  createPermission: CreatePermission;
  findByIdPermission: FindByIdPermission;
  updatePermission: UpdatePermission;
  deletePermission: DeletePermission;
  checkValidPermission: CheckValidPermission;
  resetCachePermission: ResetCachePermission;
}
