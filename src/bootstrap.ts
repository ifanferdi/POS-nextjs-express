import { Express } from 'express';
import http from 'http';
import AuthController from './adapters/http/controller/auth-controller';
import DashboardController from './adapters/http/controller/dashboard-controller';
import PermissionController from './adapters/http/controller/permission-controller';
import RoleController from './adapters/http/controller/role-controller';
import UserController from './adapters/http/controller/user-controller';
import express from './adapters/http/webserver/express';
import SocketIoServer from './adapters/websocket/socket-io-server';
import config from './config/config';
import { Controllers } from './domain/adapters/controller.interface';
import { Repositories } from './domain/repositories/repositories.interface';
import { UseCases } from './domain/use-cases/use-case.interface';
import { prisma } from './infrastructure/database/prisma/prisma';
import RedisConnection from './infrastructure/redis/redis-connection';
import PermissionRepository from './repositories/database/permission-repository';
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
import Dashboard from './use-cases/common/dashboard';
import CheckValidPermission from './use-cases/permission/check-valid-permission';
import CreatePermission from './use-cases/permission/create-permission';
import DeletePermission from './use-cases/permission/delete-permission';
import FindAllPermission from './use-cases/permission/find-all-permission';
import FindByIdPermission from './use-cases/permission/find-by-id-permission';
import ResetCachePermission from './use-cases/permission/reset-cache-permission';
import UpdatePermission from './use-cases/permission/update-permission';
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

export default async function bootstrap(app: Express, httpServer: http.Server) {
  // setup repositories
  const repositories = await setupRepositories();

  // setup use_cases
  const useCases = setupUseCases(repositories);

  // setup controllers
  const controllers = setupControllers(useCases);

  // setup routes
  express(app, controllers, useCases);

  new SocketIoServer(httpServer, useCases).execute();
}

function setupControllers(useCases: UseCases): Controllers {
  return {
    dashboardController: new DashboardController(useCases),
    userController: new UserController(useCases),
    authController: new AuthController(useCases),
    permissionController: new PermissionController(useCases),
    roleController: new RoleController(useCases),
  };
}

async function setupRepositories(): Promise<Repositories> {
  const redisClient = await RedisConnection();

  return {
    roleRepository: new RoleRepository(prisma),
    permissionRepository: new PermissionRepository(prisma),
    userRepository: new UserRepository(prisma),
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
  };
}
