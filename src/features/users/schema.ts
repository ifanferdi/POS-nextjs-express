import { Gender, UserRelation } from '@/domain';
import {
  BasePagination,
  booleanSchema,
  idSchema,
  nameSchema,
  numberSchema,
  optionalStringSchema,
  passwordSchema,
  stringSchema,
  usernameSchema,
} from '@/lib/base.schema';
import { calculateAge } from '@/lib/helper';
import { z } from 'zod';

const Relation = z.array(z.enum(UserRelation)).optional();

export const GetAllUserSchema = BasePagination.extend({
  isActive: booleanSchema.optional(),
  roleId: z.union([numberSchema, z.array(numberSchema)]).optional(),
  username: optionalStringSchema,
  usernames: z.array(stringSchema).optional(),
  role: z.union([stringSchema, z.array(stringSchema)]).optional(),
  with: Relation,
});

const ProfileSchema = z
  .object({
    fullName: nameSchema,
    placeOfBirth: stringSchema,
    dateOfBirth: stringSchema,
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
  password: passwordSchema,
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

export type UserRelationParams = z.infer<typeof Relation>;
export type GetAllUserParams = z.infer<typeof GetAllUserSchema>;
export type CreateUserInput = z.input<typeof CreateUserSchema>;
export type UpdateUserInput = z.input<typeof UpdateUserSchema>;
