import { Permission } from '@/domain/permission.types';
import { User } from '@/domain/user.types';

export interface Role {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  users: User[];
  permissions?: Permission[];
}

export enum RoleRelation {
  USERS = 'users',
  PERMISSIONS = 'permissions',
}
