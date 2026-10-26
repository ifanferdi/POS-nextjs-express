'use server';

import * as api from '@/features/dashboard/api';
import {
  DashboardRangeParams,
  DashboardTopProductsParams,
  DashboardTrendParams,
} from '@/features/dashboard/schema';
import { unstable_rethrow } from 'next/navigation';

/**
 * Guard bersama untuk query dashboard: teruskan error ke TanStack Query
 * (query perlu error agar widget bisa tampil status error + retry).
 * Auth + redirect 401 ditangani interceptor di `lib/api-server`.
 */
async function guard<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    unstable_rethrow(error);
    throw error instanceof Error ? error : new Error('Failed to load dashboard data.');
  }
}

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
