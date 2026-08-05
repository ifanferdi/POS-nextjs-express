import { Express } from 'express';
import AuthController from './adapters/http/controller/auth-controller';
import CategoryController from './adapters/http/controller/category-controller';
import DashboardController from './adapters/http/controller/dashboard-controller';
import OrderController from './adapters/http/controller/order-controller';
import PaymentController from './adapters/http/controller/payment-controller';
import PermissionController from './adapters/http/controller/permission-controller';
import ProductController from './adapters/http/controller/product-controller';
import RoleController from './adapters/http/controller/role-controller';
import UserController from './adapters/http/controller/user-controller';
import express from './adapters/http/webserver/express';
import config from './config/config';
import { Controllers } from './domain/adapters/controller.interface';
import { Repositories } from './domain/repositories/repositories.interface';
import { UseCases } from './domain/use-cases/use-case.interface';
import { prisma } from './infrastructure/database/prisma/prisma';
import RedisConnection from './infrastructure/redis/redis-connection';
import CategoryRepository from './repositories/database/category-repository';
import OrderRepository from './repositories/database/order-repository';
import PaymentRepository from './repositories/database/payment-repository';
import PermissionRepository from './repositories/database/permission-repository';
import ProductRepository from './repositories/database/product-repository';
import RoleRepository from './repositories/database/role-repository';
import UserRepository from './repositories/database/user-repository';
import LocalStorageRepository from './repositories/filesystem/local-storage-repository';
import S3StorageRepository from './repositories/filesystem/s3-storage-repository';
import RedisRepository from './repositories/redis/redis-repository';
import SendOtp from './use-cases/auth/2FA/send-otp';
import VerifyOtp from './use-cases/auth/2FA/verify-otp';
import Authorization from './use-cases/auth/authorization';
import CheckToken from './use-cases/auth/check-token';
import RefreshToken from './use-cases/auth/refresh-token';
import SignIn from './use-cases/auth/sign-in';
import SignOut from './use-cases/auth/sign-out';
import CreateCategory from './use-cases/category/create-category';
import DeleteCategory from './use-cases/category/delete-category';
import FindAllCategory from './use-cases/category/find-all-category';
import FindByIdCategory from './use-cases/category/find-by-id-category';
import UpdateCategory from './use-cases/category/update-category';
import Dashboard from './use-cases/common/dashboard';
import PosDashboard from './use-cases/common/pos-dashboard';
import CancelOrder from './use-cases/order/cancel-order';
import CreateOrder from './use-cases/order/create-order';
import FindAllOrder from './use-cases/order/find-all-order';
import FindByIdOrder from './use-cases/order/find-by-id-order';
import UpdateOrderStatus from './use-cases/order/update-order-status';
import CreatePayment from './use-cases/payment/create-payment';
import FindAllPayment from './use-cases/payment/find-all-payment';
import FindByIdPayment from './use-cases/payment/find-by-id-payment';
import CheckValidPermission from './use-cases/permission/check-valid-permission';
import CreatePermission from './use-cases/permission/create-permission';
import DeletePermission from './use-cases/permission/delete-permission';
import FindAllPermission from './use-cases/permission/find-all-permission';
import FindByIdPermission from './use-cases/permission/find-by-id-permission';
import ResetCachePermission from './use-cases/permission/reset-cache-permission';
import UpdatePermission from './use-cases/permission/update-permission';
import CreateProduct from './use-cases/product/create-product';
import DeleteProduct from './use-cases/product/delete-product';
import FindAllProduct from './use-cases/product/find-all-product';
import FindByIdProduct from './use-cases/product/find-by-id-product';
import ProductImage from './use-cases/product/product-image';
import RestoreProduct from './use-cases/product/restore-product';
import UpdateProduct from './use-cases/product/update-product';
import CreateRole from './use-cases/role/create-role';
import DeleteRole from './use-cases/role/delete-role';
import FindAllRole from './use-cases/role/find-all-role';
import FindByIdRole from './use-cases/role/find-by-id-role';
import RoleAssignPermission from './use-cases/role/role-assign-permission';
import UpdateRole from './use-cases/role/update-role';
import CreateUser from './use-cases/user/create-user';
import DeleteUser from './use-cases/user/delete-user';
import FindAllUser from './use-cases/user/find-all-user';
import FindByIdUser from './use-cases/user/find-by-id-user';
import ProfileImage from './use-cases/user/profile-image';
import RestoreUser from './use-cases/user/restore-user';
import UpdateUser from './use-cases/user/update-user';

export default async function bootstrap(app: Express) {
  const repositories = await setupRepositories();
  const useCases = setupUseCases(repositories);
  const controllers = setupControllers(useCases);

  express(app, controllers, useCases);
}

function setupControllers(useCases: UseCases): Controllers {
  return {
    dashboardController: new DashboardController(useCases),
    userController: new UserController(useCases),
    authController: new AuthController(useCases),
    permissionController: new PermissionController(useCases),
    roleController: new RoleController(useCases),
    categoryController: new CategoryController(useCases),
    productController: new ProductController(useCases),
    orderController: new OrderController(useCases),
    paymentController: new PaymentController(useCases),
  };
}

async function setupRepositories(): Promise<Repositories> {
  const redisClient = await RedisConnection();

  return {
    roleRepository: new RoleRepository(prisma),
    permissionRepository: new PermissionRepository(prisma),
    userRepository: new UserRepository(prisma),
    categoryRepository: new CategoryRepository(prisma),
    productRepository: new ProductRepository(prisma),
    orderRepository: new OrderRepository(prisma),
    paymentRepository: new PaymentRepository(prisma),
    redisRepository: new RedisRepository(redisClient),
    storageRepository:
      config.filesystem.toLowerCase() === 'local'
        ? new LocalStorageRepository()
        : new S3StorageRepository(),
  };
}

function setupUseCases(repositories: Repositories): UseCases {
  return {
    commonUseCase: {
      dashboard: new Dashboard(repositories),
      posDashboard: new PosDashboard(repositories),
    },
    userUseCase: {
      findAllUser: new FindAllUser(repositories),
      createUser: new CreateUser(repositories),
      findByIdUser: new FindByIdUser(repositories),
      updateUser: new UpdateUser(repositories),
      deleteUser: new DeleteUser(repositories),
      restoreUser: new RestoreUser(repositories),
      profileImage: new ProfileImage(repositories),
    },
    authUseCase: {
      signIn: new SignIn(repositories),
      signOut: new SignOut(repositories),
      checkToken: new CheckToken(repositories),
      authorization: new Authorization(repositories),
      refreshToken: new RefreshToken(repositories),
      sendOtp: new SendOtp(repositories),
      verifyOtp: new VerifyOtp(repositories),
    },
    permissionUseCase: {
      findAllPermission: new FindAllPermission(repositories),
      createPermission: new CreatePermission(repositories),
      findByIdPermission: new FindByIdPermission(repositories),
      updatePermission: new UpdatePermission(repositories),
      deletePermission: new DeletePermission(repositories),
      checkValidPermission: new CheckValidPermission(repositories),
      resetCachePermission: new ResetCachePermission(repositories),
    },
    roleUseCase: {
      findAllRole: new FindAllRole(repositories),
      createRole: new CreateRole(repositories),
      findByIdRole: new FindByIdRole(repositories),
      updateRole: new UpdateRole(repositories),
      deleteRole: new DeleteRole(repositories),
      roleAssignPermission: new RoleAssignPermission(repositories),
    },
    categoryUseCase: {
      findAllCategory: new FindAllCategory(repositories),
      findByIdCategory: new FindByIdCategory(repositories),
      createCategory: new CreateCategory(repositories),
      updateCategory: new UpdateCategory(repositories),
      deleteCategory: new DeleteCategory(repositories),
    },
    productUseCase: {
      findAllProduct: new FindAllProduct(repositories),
      findByIdProduct: new FindByIdProduct(repositories),
      createProduct: new CreateProduct(repositories),
      updateProduct: new UpdateProduct(repositories),
      deleteProduct: new DeleteProduct(repositories),
      restoreProduct: new RestoreProduct(repositories),
      productImage: new ProductImage(repositories),
    },
    orderUseCase: {
      findAllOrder: new FindAllOrder(repositories),
      findByIdOrder: new FindByIdOrder(repositories),
      createOrder: new CreateOrder(repositories),
      updateOrderStatus: new UpdateOrderStatus(repositories),
      cancelOrder: new CancelOrder(repositories),
    },
    paymentUseCase: {
      findAllPayment: new FindAllPayment(repositories),
      findByIdPayment: new FindByIdPayment(repositories),
      createPayment: new CreatePayment(repositories),
    },
  };
}
