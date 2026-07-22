import { z } from 'zod';

export const baseSchema = {
  string: z.string().trim(),
  id: z.number().min(1),
  name: z.string().trim().max(255),
  email: z.email().trim(),
  username: z.string().trim().min(3).max(20),
  password: z.string().trim().min(8).max(16),
  requiredString: z.string().trim().min(1).max(255),
  optionalString: z.string().trim().optional(),
  boolean: z.boolean(),
} as const;
