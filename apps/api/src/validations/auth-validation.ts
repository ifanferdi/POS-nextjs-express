import { NumberSchema, Password, StringSchema, Username } from '@/validations/base-validation';
import { z } from 'zod';

export const SignInAuthSchema = z.object({
  username: Username.min(1, 'Username cannot be empty.'),
  password: Password.min(1, 'Password cannot be empty.'),
});
export const TokenSchema = z.object({ token: StringSchema.min(1, 'Token cannot be empty.') });
export const ResendOtpSchema = z.object({ userId: NumberSchema });
export const VerifyOtpSchema = z.object({
  otp: StringSchema.min(1, 'Otp cannot be empty.'),
  userId: NumberSchema,
});

export interface SignInAuthDto extends z.infer<typeof SignInAuthSchema> {}
export interface VerifyOtpDto extends z.infer<typeof VerifyOtpSchema> {}
export interface ResendOtpDto extends z.infer<typeof ResendOtpSchema> {}
export type TokenDto = z.infer<typeof TokenSchema>;
