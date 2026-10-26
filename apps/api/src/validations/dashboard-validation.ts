import { DateStringSchema } from '@/validations/base-validation';
import { z } from 'zod';

export const DashboardQuerySchema = z
  .object({
    from: DateStringSchema.optional(),
    to: DateStringSchema.optional(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
    tz: z.string().trim().min(1).max(64).default('UTC'),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'from must not be after to.' });
  });

export interface DashboardQueryDto extends z.infer<typeof DashboardQuerySchema> {}
