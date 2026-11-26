import { DashboardTopProduct } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

export default class DashboardTopProducts extends DashboardBaseUseCase {
  async execute(params: DashboardQueryDto): Promise<DashboardTopProduct[]> {
    const range = this.resolveRange(params);
    const limit = params.limit;

    return this.cached(`top-products:${range.from}:${range.to}:${range.tz}:${limit}`, () =>
      this.repositories.dashboardRepository.topProducts({ ...range, limit }),
    );
  }
}
