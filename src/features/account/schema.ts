import { Gender } from '@/domain';
import {
  optionalStringSchema,
  passwordSchema,
  requiredStringSchema,
  usernameSchema,
} from '@/lib/base.schema';
import { z } from 'zod';

export const AccountProfileSchema = z.object({
  username: usernameSchema,
  profile: z.object({
    fullName: requiredStringSchema('Full Name'),
    placeOfBirth: requiredStringSchema('Place Of Birth'),
    dateOfBirth: requiredStringSchema('Date Of Birth'),
    gender: z.enum(Gender),
    imagePath: z.string().trim().nullish(),
  }),
});

export const ChangePasswordSchema = z
  .object({
    oldPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: optionalStringSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password and Confirm Password do not match.',
    path: ['confirmPassword'],
  });

export type AccountProfileInput = z.input<typeof AccountProfileSchema>;
export type ChangePasswordInput = z.input<typeof ChangePasswordSchema>;
