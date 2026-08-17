import { z } from 'zod';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { USER_FIELD } from '@/domain/entities/models/user';
import { JwtData } from '@/domain/entities/types/auth.types';
import { SoftDeleteFields } from '@/domain/entities/types/database.types';
import { calculateAge } from '@/helpers/common.helper';
import AppError from '@/helpers/error.helper';
import { Gender } from '@/domain/entities/enums/user.enum';
import {
  BaseFindById,
  BasePagination,
  DateSchema,
  NumberSchema,
  Password,
  StringSchema,
  Username,
} from '@/validations/base-validation';

// User Validation
const Relations = z.array(z.nativeEnum(UserRelation).optional()).optional();
const userColumns = z.array(z.nativeEnum(USER_FIELD)).optional();
export const FindByIdUserSchema = BaseFindById.extend({ with: Relations, columns: userColumns });
export const FindOneUserSchema = z
  .object({
    id: NumberSchema.optional(),
    username: StringSchema.optional(),
    isActive: z.boolean().optional(),
    columns: userColumns,
    with: Relations,
  })
  .refine((data) => !data.id && !data.username, {
    message: 'Must use one one of id or username.',
    path: ['id'],
  });
export const FindAllUserSchema = BasePagination(USER_FIELD)
  .extend({
    isActive: z.boolean().optional(),
    roleId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    email: z.union([StringSchema, z.array(StringSchema)]).optional(),
    username: StringSchema.optional(),
    usernames: z.array(StringSchema).optional(),
    role: z.union([StringSchema, z.array(StringSchema)]).optional(),
    with: Relations,
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ids and notId params cannot be used together!`,
      });
    if (data.roleId && data.role)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `role and roleId params cannot be used together!`,
      });
  });
const UserBaseCreateUpdate = z.object({
  username: Username,
  isActive: z.boolean(),
  roleId: z.number(),
});
export const CreateUserSchema = UserBaseCreateUpdate.extend({
  password: Password,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password must match.',
  path: ['confirmPassword'],
});
export const UpdateUserSchema = UserBaseCreateUpdate.extend({
  id: z.number(),
  password: Password.optional(),
  confirmPassword: Password.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password must match.',
  path: ['confirmPassword'],
});

// Profile Validation
export const FindAllProfileSchema = BasePagination(USER_FIELD)
  .omit({ page: true, limit: true })
  .extend({
    userIds: z.array(z.number()).optional(),
  });
const BaseProfileSchema = z.object({
  userId: z.number().optional(),
  fullName: StringSchema.max(255),
  placeOfBirth: StringSchema.max(255),
  dateOfBirth: DateSchema,
  gender: z.nativeEnum(Gender),
  imagePath: StringSchema.optional(),
});
export const CreateProfileSchema = BaseProfileSchema.transform((data) => ({
  ...data,
  age: calculateAge(new Date(data.dateOfBirth)),
}));
export const UpdateProfileSchema = CreateProfileSchema;

export const CreateUserProfileSchema = UserBaseCreateUpdate.extend({
  profile: CreateProfileSchema.optional(),
  password: Password,
  confirmPassword: Password.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password must match.',
  path: ['confirmPassword'],
});

export const UpdateUserProfileSchema = UserBaseCreateUpdate.extend({
  id: z.number(),
  profile: UpdateProfileSchema.optional(),
  password: Password.optional(),
  confirmPassword: Password.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password and Confirm Password must match.',
  path: ['confirmPassword'],
});

// Password Validation
export const ChangePasswordSchema = z.object({
  oldPassword: Password.optional(),
  password: Password.optional(),
  confirmPassword: Password.optional(),
});

export const ProfileImageSchema = z.object({
  image: z.any().refine((file) => {
    if (!file) throw new AppError('Column image: Required');
    return file;
  }),
});

// Data Transfer Object All Validation
export interface ChangePasswordDto extends z.infer<typeof ChangePasswordSchema> {}
export interface FindAllUserDto extends z.infer<typeof FindAllUserSchema>, SoftDeleteFields {}
export interface CreateUserDto extends z.infer<typeof CreateUserSchema> {}
export interface UpdateUserDto extends z.infer<typeof UpdateUserSchema> {}
export interface FindAllProfileDto extends z.infer<typeof FindAllProfileSchema> {}
export interface FindOneUserDto extends z.infer<typeof FindOneUserSchema> {}
export interface CreateProfileDto extends z.infer<typeof CreateProfileSchema> {}
export interface UpdateProfileDto extends z.infer<typeof UpdateProfileSchema> {}
export interface CreateUserProfileDto extends z.infer<typeof CreateUserProfileSchema> {}
export interface UpdateUserProfileDto extends z.infer<typeof UpdateUserProfileSchema> {
  auth?: JwtData;
}
export type FindByIdUserDto = z.infer<typeof FindByIdUserSchema>;
