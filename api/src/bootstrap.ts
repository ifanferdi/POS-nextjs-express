import AppController from '@/adapters/http/controller/app-controller';
import AuthController from '@/adapters/http/controller/auth-controller';
import CategoryController from '@/adapters/http/controller/category-controller';
import MidtransController from '@/adapters/http/controller/midtrans-controller';
import OrderController from '@/adapters/http/controller/order-controller';
import PaymentController from '@/adapters/http/controller/payment-controller';
import PermissionController from '@/adapters/http/controller/permission-controller';
import ProductController from '@/adapters/http/controller/product-controller';
import RoleController from '@/adapters/http/controller/role-controller';
import UserController from '@/adapters/http/controller/user-controller';
import express from '@/adapters/http/webserver/express';
import { Controllers } from '@/domain/adapters/controller.interface';
import { UseCases } from '@/domain/use-cases/use-case.interface';
import SendOtp from '@/use-cases/auth/2FA/send-otp';
import VerifyOtp from '@/use-cases/auth/2FA/verify-otp';
import Authorization from '@/use-cases/auth/authorization';
import CheckToken from '@/use-cases/auth/check-token';
import RefreshToken from '@/use-cases/auth/refresh-token';
import SignIn from '@/use-cases/auth/sign-in';
import SignOut from '@/use-cases/auth/sign-out';
import CreateCategory from '@/use-cases/category/create-category';
import DeleteCategory from '@/use-cases/category/delete-category';
import FindAllCategory from '@/use-cases/category/find-all-category';
import FindByIdCategory from '@/use-cases/category/find-by-id-category';
import UpdateCategory from '@/use-cases/category/update-category';
import PosDashboard from '@/use-cases/common/pos-dashboard';
import CancelOrder from '@/use-cases/order/cancel-order';
import CreateOrder from '@/use-cases/order/create-order';
import FindAllOrder from '@/use-cases/order/find-all-order';
import FindByIdOrder from '@/use-cases/order/find-by-id-order';
import UpdateOrderStatus from '@/use-cases/order/update-order-status';
import FindAllPayment from '@/use-cases/payment/find-all-payment';
import FindByIdPayment from '@/use-cases/payment/find-by-id-payment';
import FindByOrderId from '@/use-cases/payment/find-by-order-id';
import CheckValidPermission from '@/use-cases/permission/check-valid-permission';
import CreatePermission from '@/use-cases/permission/create-permission';
import DeletePermission from '@/use-cases/permission/delete-permission';
import FindAllPermission from '@/use-cases/permission/find-all-permission';
import FindByIdPermission from '@/use-cases/permission/find-by-id-permission';
import ResetCachePermission from '@/use-cases/permission/reset-cache-permission';
import UpdatePermission from '@/use-cases/permission/update-permission';
import CreateProduct from '@/use-cases/product/create-product';
import DeleteProduct from '@/use-cases/product/delete-product';
import FindAllProduct from '@/use-cases/product/find-all-product';
import FindByIdProduct from '@/use-cases/product/find-by-id-product';
import ProductImage from '@/use-cases/product/product-image';
import RestoreProduct from '@/use-cases/product/restore-product';
import UpdateProduct from '@/use-cases/product/update-product';
import CreateRole from '@/use-cases/role/create-role';
import DeleteRole from '@/use-cases/role/delete-role';
import FindAllRole from '@/use-cases/role/find-all-role';
import FindByIdRole from '@/use-cases/role/find-by-id-role';
import RoleAssignPermission from '@/use-cases/role/role-assign-permission';
import UpdateRole from '@/use-cases/role/update-role';
import CreateUser from '@/use-cases/user/create-user';
import DeleteUser from '@/use-cases/user/delete-user';
import FindAllUser from '@/use-cases/user/find-all-user';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import MyAccount from '@/use-cases/user/my-account';
import ProfileImage from '@/use-cases/user/profile-image';
import RestoreUser from '@/use-cases/user/restore-user';
import UpdateUser from '@/use-cases/user/update-user';
import { Express } from 'express';
import SseController from './adapters/http/controller/sse-controller';
import { initSSERedisBridge } from './infrastructure/event-stream/sse-redis-bridge';
import RedisConnection from './infrastructure/redis/redis-connection';
import GeneratePresignUrl from './use-cases/common/upload-presign-url';
import SyncMidtransToDatabase from './use-cases/midtrans/sync-midtrans-to-database';

export default async function bootstrap(app: Express) {
  const useCases = await setupUseCases();
  const controllers = setupControllers(useCases);

  await initSSERedisBridge();

  express(app, controllers, useCases);
}

function setupControllers(useCases: UseCases): Controllers {
  return {
    appController: new AppController(useCases),
    sseController: new SseController(),
    userController: new UserController(useCases),
    authController: new AuthController(useCases),
    permissionController: new PermissionController(useCases),
    roleController: new RoleController(useCases),
    categoryController: new CategoryController(useCases),
    productController: new ProductController(useCases),
    orderController: new OrderController(useCases),
    paymentController: new PaymentController(useCases),
    midtransController: new MidtransController(useCases),
  };
}

async function setupUseCases(): Promise<UseCases> {
  const redisClient = await RedisConnection();

  return {
    commonUseCase: {
      generatePresignUrl: new GeneratePresignUrl(redisClient),
      posDashboard: new PosDashboard(redisClient),
    },
    userUseCase: {
      findAllUser: new FindAllUser(redisClient),
      createUser: new CreateUser(redisClient),
      findByIdUser: new FindByIdUser(redisClient),
      myAccount: new MyAccount(redisClient),
      updateUser: new UpdateUser(redisClient),
      deleteUser: new DeleteUser(redisClient),
      restoreUser: new RestoreUser(redisClient),
      profileImage: new ProfileImage(redisClient),
    },
    authUseCase: {
      signIn: new SignIn(redisClient),
      signOut: new SignOut(redisClient),
      checkToken: new CheckToken(redisClient),
      authorization: new Authorization(redisClient),
      refreshToken: new RefreshToken(redisClient),
      sendOtp: new SendOtp(redisClient),
      verifyOtp: new VerifyOtp(redisClient),
    },
    permissionUseCase: {
      findAllPermission: new FindAllPermission(redisClient),
      createPermission: new CreatePermission(redisClient),
      findByIdPermission: new FindByIdPermission(redisClient),
      updatePermission: new UpdatePermission(redisClient),
      deletePermission: new DeletePermission(redisClient),
      checkValidPermission: new CheckValidPermission(redisClient),
      resetCachePermission: new ResetCachePermission(redisClient),
    },
    roleUseCase: {
      findAllRole: new FindAllRole(redisClient),
      createRole: new CreateRole(redisClient),
      findByIdRole: new FindByIdRole(redisClient),
      updateRole: new UpdateRole(redisClient),
      deleteRole: new DeleteRole(redisClient),
      roleAssignPermission: new RoleAssignPermission(redisClient),
    },
    categoryUseCase: {
      findAllCategory: new FindAllCategory(redisClient),
      findByIdCategory: new FindByIdCategory(redisClient),
      createCategory: new CreateCategory(redisClient),
      updateCategory: new UpdateCategory(redisClient),
      deleteCategory: new DeleteCategory(redisClient),
    },
    productUseCase: {
      findAllProduct: new FindAllProduct(redisClient),
      findByIdProduct: new FindByIdProduct(redisClient),
      createProduct: new CreateProduct(redisClient),
      updateProduct: new UpdateProduct(redisClient),
      deleteProduct: new DeleteProduct(redisClient),
      restoreProduct: new RestoreProduct(redisClient),
      productImage: new ProductImage(redisClient),
    },
    orderUseCase: {
      findAllOrder: new FindAllOrder(redisClient),
      findByIdOrder: new FindByIdOrder(redisClient),
      createOrder: new CreateOrder(redisClient),
      updateOrderStatus: new UpdateOrderStatus(redisClient),
      cancelOrder: new CancelOrder(redisClient),
    },
    paymentUseCase: {
      findAllPayment: new FindAllPayment(redisClient),
      findByIdPayment: new FindByIdPayment(redisClient),
      findByOrderId: new FindByOrderId(redisClient),
    },
    midtransUseCase: {
      syncMidtransToDatabase: new SyncMidtransToDatabase(redisClient),
    },
  };
}
