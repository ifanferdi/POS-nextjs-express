import { Skeleton as SkeletonComponent } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { icons } from '@/config/config';
import { stringEllipsis } from '@/lib/helper';
import Link from 'next/link';
import { ReactNode } from 'react';

export function HeaderTable({ headers }: { headers: string[] }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        {headers.map((header) => (
          <TableHead
            key={header}
            className={`text-xs text-muted-foreground ${header === '#' ? 'w-0 px-3 text-center' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

interface TableProps<T> {
  isNeedNumberColumn?: boolean;
  headers: string[];
  records: T[];
  cells: (cell: T) => {
    key: string;
    type?: 'custom' | 'default' | 'link';
    content: ReactNode;
    url?: string;
    className?: string;
  }[];
  className?: string;
}
export function DataTable<T>({
  headers,
  records,
  cells,
  isNeedNumberColumn = true,
  className,
}: TableProps<T>) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border/60 ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted dark:bg-muted/50">
            {headers.map((header) => (
              <TableHead
                key={header}
                className={`text-xs text-muted-foreground ${header === '#' ? 'w-0 px-3 text-center' : ''}`}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={index} className="group hover:bg-secondary">
              {isNeedNumberColumn && (
                <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
              )}
              {cells(record).map(({ key, content, type, url, className }) => (
                <TableCellByType
                  key={key}
                  content={content}
                  className={className}
                  type={type}
                  url={url}
                />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TableCellByType({
  content,
  type,
  url,
  className,
}: {
  content: ReactNode;
  type?: 'custom' | 'default' | 'link';
  url?: string;
  className?: string;
}) {
  switch (type) {
    case 'custom':
      return <TableCell className={className}>{content}</TableCell>;
    case 'link':
      return (
        <TableCell>
          <Link href={url || ''} className={`${className} flex items-center gap-3`}>
            {content}
          </Link>
        </TableCell>
      );
    default:
      return <TableCell className={`${className} text-muted-foreground`}>{content}</TableCell>;
  }
}

export function TooltipedCell(string: string) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="font-medium group-hover:underline">{stringEllipsis(string)}</span>
      </TooltipTrigger>
      <TooltipContent>{string}</TooltipContent>
    </Tooltip>
  );
}

export function ActionSkeleton({ className, total = 1 }: SkeletonProps) {
  return (
    <div className="flex justify-end gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Skeleton key={i} className={`size-8 rounded-full ${className}`} />
      ))}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  total?: number;
}
export function Skeleton({ className, total }: SkeletonProps) {
  return (
    <SkeletonComponent
      key={total}
      className={`bg-muted-foreground/20 dark:bg-muted ${className}`}
    />
  );
}

export function EmptyTable({ entities, icon }: { entities: string; icon: keyof typeof icons }) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No {entities} found</p>
      <p className="mt-1 text-sm text-muted-foreground">Try to add new data.</p>
    </div>
  );
}
