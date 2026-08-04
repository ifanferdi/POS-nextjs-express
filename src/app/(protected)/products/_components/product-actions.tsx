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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category, CategoryOption, Product } from '@/domain';
import { deleteProductAction } from '@/features/products/action';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ProductFormDialog } from './product-form-dialog';

interface ProductActionsProps {
  product: Product;
  categories: CategoryOption[];
}

export function ProductActions({ product, categories }: ProductActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to delete product.');
        return;
      }

      toast.success('Product deleted successfully.');
      setDeleteOpen(false);
      if (pathname !== '/products') router.push('/products');
    });
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Product actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
            <PencilIcon className="mr-1" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer"
          >
            <TrashIcon className="mr-1" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductFormDialog
        mode="edit"
        product={product}
        categories={categories}
        editOpen={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be
            undone.
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
