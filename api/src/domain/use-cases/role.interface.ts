import CreateRole from '../../use-cases/role/create-role';
import DeleteRole from '../../use-cases/role/delete-role';
import FindAllRole from '../../use-cases/role/find-all-role';
import FindByIdRole from '../../use-cases/role/find-by-id-role';
import RoleAssignPermission from '../../use-cases/role/role-assign-permission';
import UpdateRole from '../../use-cases/role/update-role';

export interface RoleUseCase {
  findAllRole: FindAllRole;
  findByIdRole: FindByIdRole;
  createRole: CreateRole;
  updateRole: UpdateRole;
  deleteRole: DeleteRole;
  roleAssignPermission: RoleAssignPermission;
}
