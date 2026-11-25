import { z } from 'zod';

export const DashboardRangeSchema = z.object({
  from: z.string().trim().date(),
  to: z.string().trim().date(),
  tz: z.string().trim().min(1),
});

export const DashboardTrendSchema = DashboardRangeSchema.extend({
  granularity: z
    .string()
    .trim()
    .pipe(z.enum(['day', 'week', 'month']))
    .default('day'),
});

export const DashboardTopProductsSchema = DashboardRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type DashboardRangeParams = z.infer<typeof DashboardRangeSchema>;
export type DashboardTrendParams = z.infer<typeof DashboardTrendSchema>;
export type DashboardTopProductsParams = z.infer<typeof DashboardTopProductsSchema>;
