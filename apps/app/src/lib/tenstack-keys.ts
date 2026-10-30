import { GetAllCategoryParams } from '@/features/categories/schema';
import { GetAllOrderParams } from '@/features/orders/schema';
import { GetAllProductParams } from '@/features/products/schema';
import { GetAllUserParams } from '@/features/users/schema';

export enum Keys {
  DASHBOARD = 'dashboard',
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  ORDERS = 'orders',
  USERS = 'users',
  PAYMENTS = 'payments',
}

export const productKeys = {
  all: <T = GetAllProductParams>(params: T) => [Keys.PRODUCTS, params] as const,
  detail: (id: string) => [Keys.PRODUCTS, id] as const,
};

export const categoryKeys = {
  all: <T = GetAllCategoryParams>(params: T) => [Keys.CATEGORIES, params] as const,
  detail: (id: string) => [Keys.CATEGORIES, id] as const,
};

export const orderKeys = {
  all: <T = GetAllOrderParams>(params: T) => [Keys.ORDERS, params] as const,
  detail: (id: string) => [Keys.ORDERS, id] as const,
};

export const userKeys = {
  all: <T = GetAllUserParams>(params: T) => [Keys.USERS, params] as const,
  detail: (id: string) => [Keys.USERS, id] as const,
};

export const dashboardKeys = {
  summary: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'summary', from, to],
  status: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'status', from, to],
  trend: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'trend', from, to],
  payments: ({ from, to }: { from: string; to: string }) => [
    Keys.DASHBOARD,
    Keys.PAYMENTS,
    from,
    to,
  ],
  topProduct: ({ from, to }: { from: string; to: string }) => [
    Keys.DASHBOARD,
    'top-products',
    from,
    to,
  ],
};
