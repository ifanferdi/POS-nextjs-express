import { DashboardSummaryResult } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

export default class DashboardSummary extends DashboardBaseUseCase {
  async execute(params: DashboardQueryDto): Promise<DashboardSummaryResult> {
    const { from, to, tz } = this.resolveRange(params);
    const prevTo = this.shiftDays(from, -1);
    const prevFrom = this.shiftDays(from, -this.daysBetween(from, to));

    return this.cached(`summary:${from}:${to}:${tz}`, async () => {
      const raw = await this.repositories.dashboardRepository.summary({
        from,
        to,
        tz,
        prevFrom,
        prevTo,
      });

      const totalRevenue = Number(raw.totalRevenue);
      const revenueOrders = Number(raw.revenueOrders);

      return {
        totalOrders: Number(raw.totalOrders),
        totalRevenue,
        avgOrderValue: revenueOrders ? Math.round(totalRevenue / revenueOrders) : 0,
        totalProducts: raw.totalProducts,
        delta: {
          totalOrders: this.deltaPct(Number(raw.totalOrders), Number(raw.totalOrdersPrev)),
          totalRevenue: this.deltaPct(totalRevenue, Number(raw.totalRevenuePrev)),
        },
      };
    });
  }
}
