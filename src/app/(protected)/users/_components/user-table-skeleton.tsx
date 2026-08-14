import { ActionSkeleton, HeaderTable, Skeleton } from '@/components/shared/table-server';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { headers } from './user-table';

export function UserTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <HeaderTable headers={headers} />
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className={`h-4 w-4`} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className={`h-4 w-36`} />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className={`h-4 w-18`} />
              </TableCell>
              <TableCell>
                <Skeleton className={`h-4 w-16`} />
              </TableCell>
              <TableCell>
                <Skeleton className={`h-4 w-40`} />
              </TableCell>
              <TableCell>
                <Skeleton className={`h-4 w-16`} />
              </TableCell>
              <TableCell>
                <Skeleton className={`h-4 w-16`} />
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
