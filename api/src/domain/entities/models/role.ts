import { Role } from '@/infrastructure/database/prisma/generated/client';
import { RoleScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { Permission } from '@aws-sdk/client-s3';

export interface IRolePermission extends Role {
  permission: Permission;
}

export type PartialRoleHasPermission = Role &
  Partial<{
    roleHasPermissions: Array<{ permission: Permission }>;
    permissions: Array<Permission>;
  }>;

export const ROLE_FIELD = RoleScalarFieldEnum;
export type ROLE_FIELD = (typeof ROLE_FIELD)[keyof typeof ROLE_FIELD];
export const ROLE_FIELDS = Object.keys(ROLE_FIELD) as ROLE_FIELD[];
export const ROLE_FIELDS_PRISMA = Object.fromEntries(ROLE_FIELDS.map((col) => [col, true]));
