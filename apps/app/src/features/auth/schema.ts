import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(100),
});

export type LoginInput = z.infer<typeof LoginSchema>;
