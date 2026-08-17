import { ActionSkeleton, HeaderTable, Skeleton } from '@/components/shared/table-server';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { headers } from '@/app/(protected)/categories/_components/category-table';

export function CategoryTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 md:w-lg">
      <Table>
        <HeaderTable headers={headers} />
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className={`h-4 w-4`} />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-52" />
              </TableCell>
              <TableCell>
                <ActionSkeleton total={3} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
