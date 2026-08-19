import AuthRoutes from '@/adapters/http/routes/auth.routes';
import CategoryRoutes from '@/adapters/http/routes/category.routes';
import OrderRoutes from '@/adapters/http/routes/order.routes';
import PaymentRoutes from '@/adapters/http/routes/payment.routes';
import PermissionRoutes from '@/adapters/http/routes/permission.routes';
import ProductRoutes from '@/adapters/http/routes/product.routes';
import RoleRoutes from '@/adapters/http/routes/role.routes';
import UserRoutes from '@/adapters/http/routes/user.routes';
import { Controllers } from '@/domain/adapters/controller.interface';
import Authorization from '@/use-cases/auth/authorization';
import { Express } from 'express';

export default function Routes(app: Express, controllers: Controllers, auth: Authorization) {
  app.get('/api/v1/dashboard', controllers.appController.index);
  app.post('/api/v1/uploads/generate-presign-url', controllers.appController.presignUrl);
  app.use('/api/v1/auth', AuthRoutes(controllers.authController));
  app.use('/api/v1/users', UserRoutes(controllers.userController, auth));
  app.use('/api/v1/permissions', PermissionRoutes(controllers.permissionController, auth));
  app.use('/api/v1/roles', RoleRoutes(controllers.roleController, auth));
  app.use('/api/v1/categories', CategoryRoutes(controllers.categoryController, auth));
  app.use('/api/v1/products', ProductRoutes(controllers.productController, auth));
  app.use('/api/v1/orders', OrderRoutes(controllers.orderController, auth));
  app.use('/api/v1/payments', PaymentRoutes(controllers.paymentController, auth));
}
