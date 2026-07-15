import AuthController from '../../adapters/http/controller/auth-controller';
import DashboardController from '../../adapters/http/controller/dashboard-controller';
import PermissionController from '../../adapters/http/controller/permission-controller';
import RoleController from '../../adapters/http/controller/role-controller';
import UserController from '../../adapters/http/controller/user-controller';

export interface Controllers {
  dashboardController: DashboardController;
  userController: UserController;
  authController: AuthController;
  roleController: RoleController;
  permissionController: PermissionController;
}
