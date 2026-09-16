import { Repositories } from '@/domain/repositories/repositories.interface';
import CategoryRepository from '@/repositories/database/category-repository';
import OrderRepository from '@/repositories/database/order-repository';
import PaymentRepository from '@/repositories/database/payment-repository';
import PermissionRepository from '@/repositories/database/permission-repository';
import ProductRepository from '@/repositories/database/product-repository';
import RoleRepository from '@/repositories/database/role-repository';
import UserRepository from '@/repositories/database/user-repository';
import S3StorageRepository from '@/repositories/filesystem/s3-storage-repository';
import MidtransRepository from '@/repositories/midtrans/midtrans-repository';
import RedisRepository from '@/repositories/redis/redis-repository';
import { RedisClientType } from 'redis';

export default abstract class BaseUseCase {
  protected repositories: Repositories;

  constructor(protected redisClient: RedisClientType) {
    this.repositories = {
      roleRepository: new RoleRepository(),
      permissionRepository: new PermissionRepository(),
      userRepository: new UserRepository(),
      categoryRepository: new CategoryRepository(),
      productRepository: new ProductRepository(),
      orderRepository: new OrderRepository(),
      paymentRepository: new PaymentRepository(),
      storageRepository: new S3StorageRepository(),
      midtransRepository: new MidtransRepository(),
      redisRepository: new RedisRepository(this.redisClient),
    };
  }
}
