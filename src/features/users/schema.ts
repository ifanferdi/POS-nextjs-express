import { Gender, UserRelation } from '@/domain';
import { calculateAge } from '@/lib/helper';
import { z } from 'zod';

const password = z.string().trim().min(8).max(16);
const Relation = z.array(z.enum(UserRelation)).optional();

export const GetAllUserSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.union([z.literal(-1), z.number().optional()]).default(10),
  orderBy: z.array(z.string().trim()).optional(),
  columns: z.array(z.string().trim()).optional(),
  search: z.string().trim().optional(),
  ids: z.array(z.number()).optional(),
  notId: z.union([z.number(), z.array(z.number())]).optional(),
  isActive: z.boolean().optional(),
  roleId: z.union([z.number(), z.array(z.number())]).optional(),
  username: z.string().trim().optional(),
  usernames: z.array(z.string().trim()).optional(),
  role: z.union([z.string().trim(), z.array(z.string().trim())]).optional(),
  with: Relation,
});

const ProfileSchema = z.object({
  fullName: z.string().trim().max(255),
  placeOfBirth: z.string().trim().max(255),
  dateOfBirth: z.string().min(1),
  gender: z.enum(Gender),
  age: z.number(),
  imagePath: z.string().trim().optional(),
});

const BaseUserSchema = ProfileSchema.extend({
  username: z.string().trim().min(3).max(20),
  confirmPassword: z.string().trim().optional(),
  isActive: z.boolean(),
  roleId: z.number().min(1),
});

export const CreateUserSchema = BaseUserSchema.safeExtend({ password })
  .refine((data) => data.password && data.password !== data.confirmPassword, {
    message: 'Password dan Konfirmasi Password not matched.',
    path: ['confirmPassword'],
  })
  .transform((data) => ({
    ...data,
    age: calculateAge(new Date(data.dateOfBirth)),
  }));

export const UpdateUserSchema = BaseUserSchema.safeExtend({
  password: password.optional(),
})
  .refine((data) => data.password && data.password !== data.confirmPassword, {
    message: 'Password dan Konfirmasi Password not matched.',
    path: ['confirmPassword'],
  })
  .transform((data) => ({ ...data, age: calculateAge(new Date(data.dateOfBirth)) }));

export type UserRelationParams = z.infer<typeof Relation>;
export type GetAllUserParams = z.infer<typeof GetAllUserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
