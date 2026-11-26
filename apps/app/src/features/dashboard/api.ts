import {
  DashboardPaymentCount,
  DashboardStatusCount,
  DashboardSummary,
  DashboardTopProduct,
  DashboardTrendPoint,
} from '@/domain';
import {
  DashboardRangeParams,
  DashboardTopProductsParams,
  DashboardTrendParams,
} from '@/features/dashboard/schema';
import { createServerApiClient } from '@/lib/api-server';

export async function getDashboardSummary(params: DashboardRangeParams) {
  const api = await createServerApiClient();
  const response = await api.get<DashboardSummary>('/v1/dashboard', { params });
  return response.data;
}

export async function getDashboardTrend(params: DashboardTrendParams) {
  const api = await createServerApiClient();
  const response = await api.get<DashboardTrendPoint[]>('/v1/dashboard/orders-trend', { params });
  return response.data;
}

export async function getDashboardOrdersByStatus(params: DashboardRangeParams) {
  const api = await createServerApiClient();
  const response = await api.get<DashboardStatusCount[]>('/v1/dashboard/orders-by-status', {
    params,
  });
  return response.data;
}

export async function getDashboardPayments(params: DashboardRangeParams) {
  const api = await createServerApiClient();
  const response = await api.get<DashboardPaymentCount[]>('/v1/dashboard/payments', { params });
  return response.data;
}

export async function getDashboardTopProducts(params: DashboardTopProductsParams) {
  const api = await createServerApiClient();
  const response = await api.get<DashboardTopProduct[]>('/v1/dashboard/top-products', {
    params,
  });
  return response.data;
}
