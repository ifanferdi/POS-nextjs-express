import PermissionRepository from '../../repositories/database/permission-repository';
import RoleRepository from '../../repositories/database/role-repository';
import UserRepository from '../../repositories/database/user-repository';
import LocalFilesystem from '../../repositories/filesystem/local-storage-repository';
import S3Filesystem from '../../repositories/filesystem/s3-storage-repository';
import { NodemailerRepository } from '../../repositories/nodemailer/nodemailer-repository';
import RabbitmqRepository from '../../repositories/rabbitmq/rabbitmq-repository';
import RedisRepository from '../../repositories/redis/redis-repository';

export interface Repositories extends ToolsRepository {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
}

interface ToolsRepository {
  rabbitmqRepository?: RabbitmqRepository;
  redisRepository?: RedisRepository;
  storageRepository?: S3Filesystem | LocalFilesystem;
  nodemailerRepository?: NodemailerRepository;
}
