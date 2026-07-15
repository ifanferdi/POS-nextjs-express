import { Express } from 'express';
import { Controllers } from '../../../domain/adapters/controller.interface';
import Authorization from '../../../use-cases/auth/authorization';
import AuthRoutes from './auth.routes';
import PermissionRoutes from './permission.routes';
import RoleRoutes from './role.routes';
import UserRoutes from './user.routes';

export default function Routes(app: Express, controllers: Controllers, auth: Authorization) {
  app.get('/api/v1/dashboard', controllers.dashboardController.index);
  app.use('/api/v1/auth', AuthRoutes(controllers.authController));
  app.use('/api/v1/users', UserRoutes(controllers.userController, auth));
  app.use('/api/v1/permissions', PermissionRoutes(controllers.permissionController, auth));
  app.use('/api/v1/roles', RoleRoutes(controllers.roleController, auth));
}
