import DashboardOrdersByStatus from '@/use-cases/dashboard/dashboard-orders-by-status';
import DashboardOrdersExport from '@/use-cases/dashboard/dashboard-orders-export';
import DashboardOrdersTrend from '@/use-cases/dashboard/dashboard-orders-trend';
import DashboardPayments from '@/use-cases/dashboard/dashboard-payments';
import DashboardSummary from '@/use-cases/dashboard/dashboard-summary';
import DashboardTopProducts from '@/use-cases/dashboard/dashboard-top-products';

export interface DashboardUseCase {
  summary: DashboardSummary;
  ordersTrend: DashboardOrdersTrend;
  ordersByStatus: DashboardOrdersByStatus;
  payments: DashboardPayments;
  topProducts: DashboardTopProducts;
  ordersExport: DashboardOrdersExport;
}
