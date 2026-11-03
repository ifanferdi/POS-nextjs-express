import { discountCycleHeaders } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-table';
import { ActionSkeleton, HeaderTable, Skeleton } from '@/components/shared/table-server';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export function DiscountCycleTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <Table>
        <HeaderTable headers={discountCycleHeaders} />
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <ActionSkeleton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
