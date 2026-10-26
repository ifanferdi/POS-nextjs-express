import { DashboardTrendPoint } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

export default class DashboardOrdersTrend extends DashboardBaseUseCase {
  async execute(params: DashboardQueryDto): Promise<DashboardTrendPoint[]> {
    const range = this.resolveRange(params);
    const granularity = params.granularity;

    return this.cached(`orders-trend:${range.from}:${range.to}:${range.tz}:${granularity}`, () =>
      this.repositories.dashboardRepository.ordersTrend({ ...range, granularity }),
    );
  }
}
