import { Role, RoleHasPermission } from '../../../infrastructure/database/prisma/generated/client';
import { RoleScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { IPermission } from './permission';
import { IUser } from './user';

export interface IRoleHasPermission extends RoleHasPermission {
  role?: IRole;
  permission?: IPermission;
}

export interface IRole extends Role {
  id: number;
  roleHasPermissions?: IRoleHasPermission[];
  users?: IUser[];
  permissions?: IPermission[];
}

export const ROLE_FIELD = RoleScalarFieldEnum;
export type ROLE_FIELD = (typeof ROLE_FIELD)[keyof typeof ROLE_FIELD];
export const ROLE_FIELDS = Object.keys(ROLE_FIELD) as ROLE_FIELD[];
export const ROLE_FIELDS_PRISMA = Object.fromEntries(ROLE_FIELDS.map((col) => [col, true]));
