'use server';

import * as api from '@/features/dashboard/api';
import {
  DashboardRangeParams,
  DashboardTopProductsParams,
  DashboardTrendParams,
} from '@/features/dashboard/schema';
import { guard } from '@/lib/helper';

export async function getDashboardSummaryAction(params: DashboardRangeParams) {
  return await guard(() => api.getDashboardSummary(params));
}

export async function getDashboardTrendAction(params: DashboardTrendParams) {
  return await guard(() => api.getDashboardTrend(params));
}

export async function getDashboardOrdersByStatusAction(params: DashboardRangeParams) {
  return await guard(() => api.getDashboardOrdersByStatus(params));
}

export async function getDashboardPaymentsAction(params: DashboardRangeParams) {
  return await guard(() => api.getDashboardPayments(params));
}

export async function getDashboardTopProductsAction(params: DashboardTopProductsParams) {
  return await guard(() => api.getDashboardTopProducts(params));
}
