import { z } from 'zod';
import { PermissionRelation } from '../domain/entities/enums/permission.enum';
import { PERMISSION_FIELD } from '../domain/entities/models/permission';
import { BaseFindById, BasePagination, NumberSchema, StringSchema } from './base-validation';

// Permission Validation
const PermissionWithEnum = z.array(z.nativeEnum(PermissionRelation).optional()).optional();
const permissionColumns = z
  .array(z.enum(Object.keys(PERMISSION_FIELD) as [PERMISSION_FIELD, ...PERMISSION_FIELD[]]))
  .optional();

export const FindByIdPermissionSchema = BaseFindById.extend({
  with: PermissionWithEnum,
  columns: permissionColumns,
});
export const FindAllPermissionSchema = BasePagination(PERMISSION_FIELD)
  .extend({
    columns: permissionColumns,
    name: z.union([StringSchema, z.array(StringSchema)]).optional(),
    roleId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    with: PermissionWithEnum,
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ids and notId params cannot be used together!`,
      });
  });
export const CreatePermissionSchema = z.object({ name: StringSchema.max(255) });
export const UpdatePermissionSchema = CreatePermissionSchema.extend({ id: z.number() });
export const CheckValidPermissionSchema = z.object({
  userId: z.number(),
  permissions: z.union([z.array(StringSchema.max(255)), StringSchema.max(255)]),
});

export const ResetCachePermissionSchema = z
  .object({
    userId: NumberSchema.optional(),
    roleId: NumberSchema.optional(),
    permissionId: NumberSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!(data.userId || data.roleId || data.permissionId))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must use one of ${Object.keys(data)} `,
      });
  });

export interface FindAllPermissionDto extends z.infer<typeof FindAllPermissionSchema> {}
export type FindByIdPermissionDto = z.infer<typeof FindByIdPermissionSchema>;
export interface CreatePermissionDto extends z.infer<typeof CreatePermissionSchema> {}
export interface UpdatePermissionDto extends z.infer<typeof UpdatePermissionSchema> {}
export interface CheckValidPermissionDto extends z.infer<typeof CheckValidPermissionSchema> {}
export type ResetCachePermissionDto = z.infer<typeof ResetCachePermissionSchema>;
