'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CategoryList } from '@/domain';
import { BoxesIcon } from 'lucide-react';
import moment from 'moment';
import { type ReactNode, useState } from 'react';

export function CategoryDetailDialog({
  category,
  trigger,
}: {
  category: CategoryList;
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
      <DialogContent className="lg:max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
        <div className="overflow-y-auto flex-1 px-8 py-10">
          <div className="flex items-start gap-4 mb-8">
            <BoxesIcon className="size-11 text-primary shrink-0 mt-1" strokeWidth={1.5} />
            <h2 className="text-4xl font-bold leading-tight tracking-tight">{category.name}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-base leading-relaxed">
                {category.description || 'No description provided.'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Products</p>
              <p className="text-base leading-relaxed">
                {category._count.productHasCategories ?? 0}
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border">
                  <span className="font-medium">Created</span>
                  <span className="font-mono">
                    {moment(category.createdAt).format('MMM D, YYYY')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border">
                  <span className="font-medium">Updated</span>
                  <span className="font-mono">
                    {moment(category.updatedAt).format('MMM D, YYYY')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
