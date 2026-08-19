'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Category } from '@/domain';
import { BoxesIcon } from 'lucide-react';
import moment from 'moment';
import { type ReactNode, useState } from 'react';

export function CategoryDetailDialog({
  category,
  trigger,
}: {
  category: Category;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="w-full gap-3 text-left group">
            <span className="font-medium group-hover:underline">{category.name}</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="lg:max-w-xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BoxesIcon className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">{category.name}</DialogTitle>
              <DialogDescription>Category detail</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="text-sm">{category.description || 'No description provided.'}</p>
          </div>
          <Separator />
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created At
              </dt>
              <dd className="text-sm">
                {moment(category.createdAt).format('MMMM D, YYYY, HH:mm')}
              </dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Updated At
              </dt>
              <dd className="text-sm">
                {moment(category.updatedAt).format('MMMM D, YYYY, HH:mm')}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Category ID: <span className="font-mono">{category.id}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
