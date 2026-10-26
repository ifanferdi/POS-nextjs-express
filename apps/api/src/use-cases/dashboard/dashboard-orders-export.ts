import { DashboardExportRow } from '@/domain/entities/types/dashboard.types';
import DashboardBaseUseCase from '@/use-cases/dashboard/_base-dashboard-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

const HEADERS = [
  'orderNumber',
  'createdAt',
  'status',
  'subtotal',
  'tax',
  'discount',
  'total',
  'method',
  'paymentStatus',
  'itemCount',
] as const;

const csvCell = (value: unknown) => {
  const string = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
};

export default class DashboardOrdersExport extends DashboardBaseUseCase {
  // shortcut: CSV di-build sebagai string utuh — cukup untuk ribuan baris;
  // ganti ke stream cursor (res.write per batch) kalau export puluhan ribu baris.
  async execute(params: DashboardQueryDto): Promise<{ csv: string; filename: string }> {
    const range = this.resolveRange(params);
    const rows = await this.repositories.dashboardRepository.ordersForExport(range);

    const lines = [
      HEADERS.join(','),
      ...rows.map((row: DashboardExportRow) =>
        HEADERS.map((header) => csvCell(row[header])).join(','),
      ),
    ];

    return { csv: lines.join('\n'), filename: `orders-${range.from}-${range.to}.csv` };
  }
}
