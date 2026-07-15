import _ from 'lodash';
import { z } from 'zod';
import { RoleRelation } from '../domain/entities/enums/role.enum';
import { ROLE_FIELD } from '../domain/entities/models/role';
import { BaseFindById, BasePagination, NumberSchema, StringSchema } from './base-validation';

const Relations = z.array(z.nativeEnum(RoleRelation)).optional();
const roleColumns = z.array(z.nativeEnum(ROLE_FIELD)).optional();
export const FindByIdRoleSchema = BaseFindById.extend({
  with: Relations,
  columns: roleColumns,
});
export const FindAllRoleSchema = BasePagination(ROLE_FIELD)
  .extend({
    name: z.union([StringSchema, z.array(StringSchema)]).optional(),
    userId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    permissionId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    with: Relations,
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ids and notId params cannot be used together!`,
      });
  });
export const CreateRoleSchema = z.object({
  id: NumberSchema.optional(),
  name: StringSchema.max(255),
  permissionIds: z.array(z.number()).optional(),
  permissions: z.array(StringSchema).optional(),
});
export const UpdateRoleSchema = CreateRoleSchema.extend({ id: z.number() });
export const RoleAssignPermissionSchema = z
  .object({
    roleId: z.number(),
    permissionIds: z.array(z.number()).optional(),
    permissions: z.array(StringSchema).optional(),
    addPermissions: z.array(StringSchema).optional(),
    removePermissions: z.array(StringSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!(data.permissionIds || data.permissions || data.addPermissions || data.removePermissions))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must use one of ${_.omit(Object.keys(data), 'roleId')} `,
      });
  });

// Data Transfer Object All Validation
export interface FindAllRoleDto extends z.infer<typeof FindAllRoleSchema> {}
export type FindByIdRoleDto = z.infer<typeof FindByIdRoleSchema>;
export interface CreateRoleDto extends z.infer<typeof CreateRoleSchema> {}
export interface UpdateRoleDto extends z.infer<typeof UpdateRoleSchema> {}
export interface RoleAssignPermissionDto extends z.infer<typeof RoleAssignPermissionSchema> {}
export interface SyncByPermissionIdsDto {
  roleId: number;
  permissionIds: number[];
}
export interface SyncByPermissionsNameDto {
  roleId: number;
  permissions: string[];
}
