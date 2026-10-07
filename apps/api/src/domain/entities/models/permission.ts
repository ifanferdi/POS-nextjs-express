import { PermissionScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';

export const PERMISSION_FIELD = PermissionScalarFieldEnum;
export type PERMISSION_FIELD = (typeof PERMISSION_FIELD)[keyof typeof PERMISSION_FIELD];
export const PERMISSION_FIELDS = Object.keys(PERMISSION_FIELD) as PERMISSION_FIELD[];
export const PERMISSION_FIELDS_PRISMA = Object.fromEntries(
  PERMISSION_FIELDS.map((col) => [col, true]),
);
