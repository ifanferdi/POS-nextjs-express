import { DashboardStatusPoint } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

export default class DashboardOrdersByStatus extends DashboardBaseUseCase {
  async execute(params: DashboardQueryDto): Promise<DashboardStatusPoint[]> {
    const range = this.resolveRange(params);

    return this.cached(`orders-by-status:${range.from}:${range.to}:${range.tz}`, () =>
      this.repositories.dashboardRepository.ordersByStatus(range),
    );
  }
}
