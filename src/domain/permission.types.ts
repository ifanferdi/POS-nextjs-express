import { Role } from '@/domain/role.types';

export interface Permission {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

export enum PermissionRelation {
  ROLES = 'roles',
}
