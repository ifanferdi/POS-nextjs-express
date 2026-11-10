import AuthRoutes from '@/adapters/http/routes/auth.routes';
import CategoryRoutes from '@/adapters/http/routes/category.routes';
import DashboardRoutes from '@/adapters/http/routes/dashboard.routes';
import OrderRoutes from '@/adapters/http/routes/order.routes';
import PaymentRoutes from '@/adapters/http/routes/payment.routes';
import PermissionRoutes from '@/adapters/http/routes/permission.routes';
import ProductDiscountCycleRoutes from '@/adapters/http/routes/product-discount-cycle.routes';
import ProductRoutes from '@/adapters/http/routes/product.routes';
import RoleRoutes from '@/adapters/http/routes/role.routes';
import UserRoutes from '@/adapters/http/routes/user.routes';
import { Controllers } from '@/domain/adapters/controller.interface';
import Authorization from '@/use-cases/auth/authorization';
import e, { Express } from 'express';
import asyncHandler from 'express-async-handler';
import SseRoutes from './sse.route';

export default function Routes(app: Express, controllers: Controllers, auth: Authorization) {
  app.use('/api/v1/dashboard', DashboardRoutes(controllers.dashboardController));
  app.post(
    '/api/v1/uploads/generate-presign-url',
    asyncHandler(async (req: e.Request, _res: e.Response, next: e.NextFunction) => {
      if (req.body?.folder === 'products') {
        await auth.authorize(['Manage Product'])(req, _res, next);
        return;
      }
      next();
    }),
    controllers.appController.presignUrl,
  );
  app.use('/api/v1/auth', AuthRoutes(controllers.authController));
  app.use('/api/v1/users', UserRoutes(controllers.userController, auth));
  app.use('/api/v1/permissions', PermissionRoutes(controllers.permissionController, auth));
  app.use('/api/v1/roles', RoleRoutes(controllers.roleController, auth));
  app.use('/api/v1/categories', CategoryRoutes(controllers.categoryController, auth));
  app.use('/api/v1/products', ProductRoutes(controllers.productController, auth));
  app.use(
    '/api/v1/product-discount-cycles',
    ProductDiscountCycleRoutes(controllers.productDiscountCycleController, auth),
  );
  app.use('/api/v1/orders', OrderRoutes(controllers.orderController, auth));
  app.use('/api/v1/payments', PaymentRoutes(controllers.paymentController, auth));
  app.use('/api/v1/sse', SseRoutes(controllers.sseController, auth));

  app.post('/api/v1/webhooks/midtrans', controllers.midtransController.webhook);
  app.post(
    '/api/v1/webhooks/midtrans/mock',
    auth.authorize(['Manage Order']),
    controllers.midtransController.mock,
  );
}
