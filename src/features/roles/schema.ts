import { RoleRelation } from '@/domain';
import { BasePagination, numberSchema, stringSchema } from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(RoleRelation)).optional();

export const GetAllRoleSchema = BasePagination.extend({
  with: Relation,
});

const BaseRoleSchema = z.object({
  name: stringSchema.max(255),
  permissionIds: z.array(numberSchema),
});

export const CreateRoleSchema = BaseRoleSchema;
export const UpdateRoleSchema = CreateRoleSchema;

export type RoleRelationParams = z.infer<typeof Relation>;
export type GetAllRoleParams = z.infer<typeof GetAllRoleSchema>;
export type CreateRoleInput = z.input<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.input<typeof UpdateRoleSchema>;
