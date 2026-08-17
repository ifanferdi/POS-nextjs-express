import AuthController from '@/adapters/http/controller/auth-controller';
import DashboardController from '@/adapters/http/controller/dashboard-controller';
import OrderController from '@/adapters/http/controller/order-controller';
import PaymentController from '@/adapters/http/controller/payment-controller';
import PermissionController from '@/adapters/http/controller/permission-controller';
import CategoryController from '@/adapters/http/controller/category-controller';
import ProductController from '@/adapters/http/controller/product-controller';
import RoleController from '@/adapters/http/controller/role-controller';
import UserController from '@/adapters/http/controller/user-controller';

export interface Controllers {
  dashboardController: DashboardController;
  userController: UserController;
  authController: AuthController;
  roleController: RoleController;
  permissionController: PermissionController;
  categoryController: CategoryController;
  productController: ProductController;
  orderController: OrderController;
  paymentController: PaymentController;
}
