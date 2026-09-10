import CategoryRepository from '@/repositories/database/category-repository';
import OrderRepository from '@/repositories/database/order-repository';
import PaymentRepository from '@/repositories/database/payment-repository';
import PermissionRepository from '@/repositories/database/permission-repository';
import ProductRepository from '@/repositories/database/product-repository';
import RoleRepository from '@/repositories/database/role-repository';
import UserRepository from '@/repositories/database/user-repository';
import S3Filesystem from '@/repositories/filesystem/s3-storage-repository';
import MidtransRepository from '@/repositories/midtrans/midtrans-repository';
import { NodemailerRepository } from '@/repositories/nodemailer/nodemailer-repository';
import RabbitmqRepository from '@/repositories/rabbitmq/rabbitmq-repository';
import RedisRepository from '@/repositories/redis/redis-repository';

export interface Repositories extends ToolsRepository {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
  categoryRepository: CategoryRepository;
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
  paymentRepository: PaymentRepository;
}

interface ToolsRepository {
  rabbitmqRepository?: RabbitmqRepository;
  redisRepository?: RedisRepository;
  storageRepository?: S3Filesystem;
  nodemailerRepository?: NodemailerRepository;
  midtransRepository?: MidtransRepository;
}
