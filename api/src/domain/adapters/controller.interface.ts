import AppController from '@/adapters/http/controller/app-controller';
import AuthController from '@/adapters/http/controller/auth-controller';
import CategoryController from '@/adapters/http/controller/category-controller';
import OrderController from '@/adapters/http/controller/order-controller';
import PaymentController from '@/adapters/http/controller/payment-controller';
import PermissionController from '@/adapters/http/controller/permission-controller';
import ProductController from '@/adapters/http/controller/product-controller';
import RoleController from '@/adapters/http/controller/role-controller';
import SseController from '@/adapters/http/controller/sse-controller';
import UserController from '@/adapters/http/controller/user-controller';

export interface Controllers {
  appController: AppController;
  sseController: SseController;
  userController: UserController;
  authController: AuthController;
  roleController: RoleController;
  permissionController: PermissionController;
  categoryController: CategoryController;
  productController: ProductController;
  orderController: OrderController;
  paymentController: PaymentController;
}
