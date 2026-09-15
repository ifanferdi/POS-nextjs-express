'use client';

import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { CategoryFormDialog } from '@/app/(protected)/categories/_components/category-form-dialog';
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
import { CategoryList } from '@/domain';
import { deleteCategoryAction } from '@/features/categories/action';
import { EyeIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function CategoryActions({ category }: { category: CategoryList }) {
  const router = useRouter();
  const pathname = usePathname();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to delete Category.');
        return;
      }

      toast.success('Category deleted successfully.');
      setDeleteOpen(false);
      if (pathname !== '/categories') router.push('/categories');
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <CategoryDetailDialog
        category={category}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="View category"
            title="View"
            className="text-muted-foreground hover:bg-info/10 hover:text-info active:scale-90"
          >
            <EyeIcon />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit category"
        title="Edit"
        onClick={() => setEditOpen(true)}
        className="text-muted-foreground hover:bg-info/10 hover:text-info active:scale-90"
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete category"
        title="Delete"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-90"
      >
        <TrashIcon />
      </Button>

      <CategoryFormDialog
        mode="edit"
        category={category}
        editOpen={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete <strong>{category.name}</strong>? This action cannot be
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
