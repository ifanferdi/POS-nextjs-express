import { Gender, UserRelation } from '@/domain';
import { baseSchema } from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(UserRelation)).optional();

export const GetAllUserSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  orderBy: z.array(z.string().trim()).optional(),
  columns: z.array(z.string().trim()).optional(),
  q: z.string().trim().optional(),
  ids: z.array(z.number()).optional(),
  notId: z.union([z.number(), z.array(z.number())]).optional(),
  isActive: z.boolean().optional(),
  roleId: z.union([z.number(), z.array(z.number())]).optional(),
  username: baseSchema.string.optional(),
  usernames: z.array(z.string().trim()).optional(),
  role: z.union([z.string().trim(), z.array(z.string().trim())]).optional(),
  with: Relation,
});    

const ProfileSchema = z.object({
  fullName: baseSchema.name,
  placeOfBirth: baseSchema.requiredString,
  dateOfBirth: z.string().min(1),
  gender: z.enum(Gender),
});

const BaseUserSchema = z.object({
  username: baseSchema.username,
  confirmPassword: baseSchema.optionalString,
  isActive: baseSchema.boolean,
  roleId: baseSchema.id,
  profile: ProfileSchema,
});

export const CreateUserSchema = BaseUserSchema.extend({
  password: baseSchema.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password do not match.',
  path: ['confirmPassword'],
});

export const UpdateUserSchema = BaseUserSchema.extend({
  password: baseSchema.password.optional(),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: 'Password and Confirm Password do not match.',
  path: ['confirmPassword'],
});

export type UserRelationParams = z.infer<typeof Relation>;
export type GetAllUserParams = z.input<typeof GetAllUserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
