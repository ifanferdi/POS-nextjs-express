import { Gender, UserRelation } from '@/domain';
import {
  BasePagination,
  booleanSchema,
  idSchema,
  numberSchema,
  optionalStringSchema,
  passwordSchema,
  requiredStringSchema,
  usernameSchema,
} from '@/lib/base.schema';
import { calculateAge } from '@/lib/helper';
import { z } from 'zod';

const Relation = z.array(z.enum(UserRelation)).optional();

export const GetAllUserSchema = BasePagination.extend({
  isActive: booleanSchema.optional(),
  roleId: z.union([numberSchema, z.array(numberSchema)]).optional(),
  username: optionalStringSchema,
  usernames: z.array(requiredStringSchema('Usernames')).optional(),
  role: z.union([requiredStringSchema('Role'), z.array(requiredStringSchema('Role'))]).optional(),
  with: Relation,
});

const ProfileSchema = z
  .object({
    fullName: requiredStringSchema('Full Name'),
    placeOfBirth: requiredStringSchema('Place Of Birth'),
    dateOfBirth: requiredStringSchema('Date Of Birth'),
    gender: z.enum(Gender),
  })
  .transform((profile) => ({
    ...profile,
    age: calculateAge(new Date(profile.dateOfBirth)),
  }));

const BaseUserSchema = z.object({
  username: usernameSchema,
  confirmPassword: optionalStringSchema,
  isActive: booleanSchema,
  roleId: idSchema,
  profile: ProfileSchema,
});

export const CreateUserSchema = BaseUserSchema.extend({
  password: passwordSchema.min(1, 'Password cannot be empty.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password do not match.',
  path: ['confirmPassword'],
});

export const UpdateUserSchema = BaseUserSchema.extend({
  password: passwordSchema.optional(),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: 'Password and Confirm Password do not match.',
  path: ['confirmPassword'],
});

const booleanFromString = z.enum(['true', 'false']).transform((v) => v === 'true');

export const GetUserSearchParamsSchema = z.object({
  page: z.coerce.number().optional(),
  q: z.string().trim().optional(),
  roleId: z.coerce.number().optional(),
  isActive: booleanFromString.optional(),
});

export type UserRelationParams = z.infer<typeof Relation>;
export type GetAllUserParams = z.infer<typeof GetAllUserSchema>;
export type GetUserSearchParams = z.infer<typeof GetUserSearchParamsSchema>;
export type CreateUserInput = z.input<typeof CreateUserSchema>;
export type UpdateUserInput = z.input<typeof UpdateUserSchema>;
