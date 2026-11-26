'use client';

import { Button } from '@/components/shared/button';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import type { DiscountProductOption } from './discount-cycle-form-dialog';
import { DiscountCycleFormDialog } from './discount-cycle-form-dialog';

export function CreateDiscountCycleButton({ products }: { products: DiscountProductOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={products.length === 0}>
        <PlusIcon />
        New discount cycle
      </Button>
      <DiscountCycleFormDialog products={products} open={open} onOpenChange={setOpen} />
    </>
  );
}
