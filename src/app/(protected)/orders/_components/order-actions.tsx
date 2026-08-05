'use client';

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
import { Order } from '@/domain';
import { deleteOrderAction } from '@/features/orders/action';
import { TrashIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function OrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrderAction(order.id);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to delete order.');
        return;
      }

      toast.success('Order deleted successfully.');
      setDeleteOpen(false);
      if (pathname !== '/orders') router.push('/orders');
    });
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete order"
        title="Delete"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-90"
      >
        <TrashIcon />
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete order <strong>{order.orderNumber}</strong>? This action
            cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete
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