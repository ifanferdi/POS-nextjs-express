import { z } from 'zod';

export const numberSchema = z.number();
export const stringSchema = z.string().trim();
export const requiredStringSchema = (string = 'Column') =>
  z.string().trim().min(1, `${string} cannot be empty`);
export const idSchema = numberSchema.min(1);
export const nameSchema = requiredStringSchema('Name').max(255);
export const emailSchema = z.email().trim();
export const usernameSchema = requiredStringSchema('Username').min(3).max(20);
export const passwordSchema = stringSchema.min(8).max(16);
export const optionalStringSchema = stringSchema.optional();
export const optionalNumberSchema = numberSchema.optional();
export const booleanSchema = z.boolean();

export const BasePagination = z.object({
  page: optionalNumberSchema.optional(),
  limit: z.union([z.literal(-1).optional(), optionalNumberSchema]),
  orderBy: z.array(stringSchema).optional().optional(),
  columns: z.array(stringSchema).optional(),
  q: optionalStringSchema,
  ids: z.array(numberSchema).optional(),
  notId: z.union([numberSchema, z.array(numberSchema)]).optional(),
});
