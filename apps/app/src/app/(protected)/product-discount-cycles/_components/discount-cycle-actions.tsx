'use client';

import type { DiscountProductOption } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-form-dialog';
import { DiscountCycleFormDialog } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-form-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductDiscountCycleList } from '@/domain';
import { deleteProductDiscountCycleAction } from '@/features/product-discount-cycles/action';
import { formatCurrency } from '@/lib/helper';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface DiscountCycleActionsProps {
  cycle: ProductDiscountCycleList;
  products: DiscountProductOption[];
  canManage: boolean;
}

export function DiscountCycleActions(props: DiscountCycleActionsProps) {
  const { cycle, products, canManage } = props;
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductDiscountCycleAction(cycle.id);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to delete discount cycle.');
        return;
      }

      toast.success('Discount cycle deleted.');
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Discount cycle actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
            <PencilIcon />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer"
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DiscountCycleFormDialog
        products={products}
        cycle={cycle}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete discount cycle</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Delete the {formatCurrency(cycle.amount)} discount on{' '}
            <strong>{cycle.product?.name ?? `product ${cycle.productId}`}</strong>? Orders already
            placed keep their recorded discount. Quota already used is not restored.
          </DialogDescription>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete cycle
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
