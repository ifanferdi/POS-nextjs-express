import { DashboardPaymentPoint } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

export default class DashboardPayments extends DashboardBaseUseCase {
  async execute(params: DashboardQueryDto): Promise<DashboardPaymentPoint[]> {
    const range = this.resolveRange(params);

    return this.cached(`payments:${range.from}:${range.to}:${range.tz}`, () =>
      this.repositories.dashboardRepository.paymentsBreakdown(range),
    );
  }
}
