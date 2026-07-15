import { z } from 'zod';
import { NumberSchema, Password, StringSchema, Username } from './base-validation';

export const SignInAuthSchema = z.object({
  username: Username,
  password: Password,
  macAddress: StringSchema.optional(),
});
export const TokenSchema = z.object({ token: StringSchema });
export const ResendOtpSchema = z.object({ userId: NumberSchema });
export const VerifyOtpSchema = z.object({ otp: StringSchema, userId: NumberSchema });

export interface SignInAuthDto extends z.infer<typeof SignInAuthSchema> {}
export interface VerifyOtpDto extends z.infer<typeof VerifyOtpSchema> {}
export interface ResendOtpDto extends z.infer<typeof ResendOtpSchema> {}
export type TokenDto = z.infer<typeof TokenSchema>;
