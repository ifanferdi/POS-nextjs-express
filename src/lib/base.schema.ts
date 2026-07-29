import { z } from 'zod';

export const numberSchema = z.coerce.number();
export const stringSchema = z.string().min(1).trim();
export const idSchema = numberSchema.min(1);
export const nameSchema = stringSchema.max(255);
export const emailSchema = z.email().trim();
export const usernameSchema = stringSchema.min(3).max(20);
export const passwordSchema = stringSchema.min(8).max(16);
export const optionalStringSchema = z.string().trim().optional();
export const optionalNumberSchema = numberSchema.optional();
export const booleanSchema = z.coerce.boolean();

export const BasePagination = z.object({
  page: optionalNumberSchema.optional(),
  limit: z.union([z.literal(-1).optional(), optionalNumberSchema]),
  orderBy: z.array(stringSchema).optional().optional(),
  columns: z.array(stringSchema).optional(),
  q: optionalStringSchema,
  ids: z.array(numberSchema).optional(),
  notId: z.union([numberSchema, z.array(numberSchema)]).optional(),
});
