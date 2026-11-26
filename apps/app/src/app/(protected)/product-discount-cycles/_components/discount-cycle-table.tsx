import { DiscountCycleActions } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-actions';
import type { DiscountProductOption } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-form-dialog';
import { DiscountBadge } from '@/components/shared/discount';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable, TooltipedCell } from '@/components/shared/table-server';
import { Badge } from '@/components/ui/badge';
import { DiscountCycleStatus, ProductDiscountCycleList } from '@/domain';
import { getAllProductDiscountCycles } from '@/features/product-discount-cycles/api';
import { GetAllProductDiscountCycleParams } from '@/features/product-discount-cycles/schema';
import { formatCurrency, formatDateTime } from '@/lib/helper';
import { cn } from '@/lib/utils';

export const discountCycleHeaders = [
  '#',
  'Product',
  'Discount',
  'Quota',
  'Starts',
  'Ends',
  'Status',
  '',
];

export const DISCOUNT_CYCLE_STATUS_STYLES: Record<DiscountCycleStatus, string> = {
  [DiscountCycleStatus.ACTIVE]: 'bg-success/15 text-success',
  [DiscountCycleStatus.SCHEDULED]: 'bg-info/10 text-info',
  [DiscountCycleStatus.EXPIRED]: 'bg-muted text-muted-foreground',
  [DiscountCycleStatus.QUOTA_EXHAUSTED]: 'bg-warning/10 text-warning',
};

const STATUS_LABELS: Record<DiscountCycleStatus, string> = {
  [DiscountCycleStatus.ACTIVE]: 'Active',
  [DiscountCycleStatus.SCHEDULED]: 'Scheduled',
  [DiscountCycleStatus.EXPIRED]: 'Ended',
  [DiscountCycleStatus.QUOTA_EXHAUSTED]: 'Quota exhausted',
};

export function getDiscountCycleStatus(
  cycle: Pick<ProductDiscountCycleList, 'startDate' | 'endDate' | 'quota' | 'usedQty'>,
  now = Date.now(),
): DiscountCycleStatus {
  if (cycle.quota !== null && cycle.usedQty >= cycle.quota)
    return DiscountCycleStatus.QUOTA_EXHAUSTED;

  const start = new Date(cycle.startDate).getTime();
  const end = new Date(cycle.endDate).getTime();

  if (now < start) return DiscountCycleStatus.SCHEDULED;
  if (now > end) return DiscountCycleStatus.EXPIRED;

  return DiscountCycleStatus.ACTIVE;
}

export function DiscountCycleStatusBadge({ status }: { status: DiscountCycleStatus }) {
  return (
    <Badge className={cn('hover:bg-inherit', DISCOUNT_CYCLE_STATUS_STYLES[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

interface DiscountCycleTableSectionProps {
  params: GetAllProductDiscountCycleParams;
  products: DiscountProductOption[];
  canManage: boolean;
}

export async function DiscountCycleTableSection(props: DiscountCycleTableSectionProps) {
  const { params, products, canManage } = props;
  const { data: cycles, ...meta } = await getAllProductDiscountCycles(params);

  return (
    <>
      <DiscountCycleTable cycles={cycles} products={products} canManage={canManage} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/product-discount-cycles"
      />
    </>
  );
}

function DiscountCycleTable({
  cycles,
  products,
  canManage,
}: {
  cycles: ProductDiscountCycleList[];
  products: DiscountProductOption[];
  canManage: boolean;
}) {
  if (cycles.length === 0)
    return (
      <EmptyTable
        headers={discountCycleHeaders}
        entities="discount cycles"
        icon="discount"
        className="overflow-x-auto"
      />
    );

  return (
    <DataTable
      className="overflow-x-auto"
      headers={discountCycleHeaders}
      records={cycles}
      cells={(cycle) => {
        const status = getDiscountCycleStatus(cycle);
        const remaining = cycle.quota === null ? null : Math.max(0, cycle.quota - cycle.usedQty);

        return [
          {
            key: 'product',
            type: 'custom',
            content: TooltipedCell(cycle.product?.name ?? `Product ${cycle.productId}`),
          },
          {
            key: 'discount',
            type: 'custom',
            content: (
              <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                <span className="text-muted-foreground tabular-nums">
                  -{formatCurrency(cycle.amount)}
                </span>
                <DiscountBadge price={cycle.product?.price ?? 0} amount={cycle.amount} />
              </span>
            ),
          },
          {
            key: 'quota',
            type: 'custom',
            content:
              cycle.quota === null ? (
                <span className="text-muted-foreground">Unlimited</span>
              ) : (
                <span className="text-xs tabular-nums">
                  <span className="font-medium">
                    {cycle.usedQty} / {cycle.quota}
                  </span>
                  <span className="block text-muted-foreground">
                    {remaining} {remaining === 1 ? 'unit' : 'units'} left
                  </span>
                </span>
              ),
          },
          {
            key: 'starts',
            type: 'custom',
            content: (
              <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDateTime(cycle.startDate)}
              </span>
            ),
          },
          {
            key: 'ends',
            type: 'custom',
            content: (
              <span className="whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDateTime(cycle.endDate)}
              </span>
            ),
          },
          {
            key: 'status',
            type: 'custom',
            content: <DiscountCycleStatusBadge status={status} />,
          },
          {
            key: 'actions',
            type: 'custom',
            content: (
              <div className="flex justify-end">
                <DiscountCycleActions cycle={cycle} products={products} canManage={canManage} />
              </div>
            ),
          },
        ];
      }}
    />
  );
}
