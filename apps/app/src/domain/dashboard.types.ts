import { OrderStatus } from '@/domain/order.types';
import { PaymentMethod, PaymentStatus } from '@/domain/payment.types';

export type DashboardGranularity = 'day' | 'week' | 'month';

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalProducts: number;
  /** Persen vs periode sebelumnya (panjang sama); null kalau periode sebelumnya 0. */
  delta: Partial<
    Record<'totalOrders' | 'totalRevenue' | 'avgOrderValue' | 'totalProducts', number | null>
  >;
}

export interface DashboardTrendPoint {
  /** Tanggal awal bucket (week: Senin, month: tanggal 1). */
  bucket: string;
  orders: number;
  revenue: number;
}

export interface DashboardStatusCount {
  status: OrderStatus;
  count: number;
}

export interface DashboardPaymentCount {
  method: PaymentMethod;
  status: PaymentStatus;
  count: number;
  amount: number;
}

export interface DashboardTopProduct {
  productId: number;
  /** null untuk produk yang sudah dihapus. */
  name: string | null;
  quantity: number;
  revenue: number;
}
