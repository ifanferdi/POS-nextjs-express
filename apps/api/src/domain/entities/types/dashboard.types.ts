export interface DashboardSummaryResult {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalProducts: number;
  delta: {
    totalOrders: number | null;
    totalRevenue: number | null;
  };
}

export interface DashboardTrendPoint {
  bucket: string;
  orders: number;
  revenue: number;
}

export interface DashboardStatusPoint {
  status: string;
  count: number;
}

export interface DashboardPaymentPoint {
  method: string;
  status: string;
  count: number;
  amount: number;
}

export interface DashboardTopProduct {
  productId: number | null;
  name: string | null;
  quantity: number;
  revenue: number;
}

export interface DashboardExportRow {
  orderNumber: string;
  createdAt: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  method: string;
  paymentStatus: string;
  itemCount: number;
}
