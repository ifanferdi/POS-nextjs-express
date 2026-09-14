import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '@/domain';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { Loader2Icon, MinusIcon, PackageIcon, PlusIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function ProductCard({
  product,
  items,
  onAdd,
}: {
  product: Product;
  items: CartItem[];
  onAdd: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
}) {
  const add = onAdd;
  const setItem = useCartStore((s) => s.setItem);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);

  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;
  const added = qty > 0;

  return (
    <div
      className={cn(
        'bg-card group flex flex-col overflow-hidden rounded-lg border transition-all duration-300',
        added ? 'border-primary' : 'hover:shadow-lg hover:-translate-y-1',
      )}
    >
      <div className="relative aspect-square w-full bg-muted/50">
        <ProductImage imageUrl={product.imageUrl} name={product.name} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
        <p className="text-sm font-semibold text-primary" suppressHydrationWarning>
          {formatCurrency(product.price)}
        </p>
        <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>

        {!added ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              add({
                productId: product.id,
                name: product.name,
                price: product.price,
                imagePath: product.imagePath,
                imageUrl: product.imageUrl,
                stock: product.stock,
              })
            }
            className="mt-1 w-full hover:bg-muted dark:hover:bg-muted"
          >
            + Add
          </Button>
        ) : (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => remove(product.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-destructive hover:text-white"
              aria-label="Remove from cart"
            >
              <XIcon className="size-3.5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-border/60">
              <button
                type="button"
                onClick={() => dec(product.id)}
                className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition hover:bg-muted rounded-s-md"
                aria-label="Decrease"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <Input
                aria-label={`${product.name} quantity`}
                type="text"
                inputMode="numeric"
                value={qty}
                onChange={(e) =>
                  setItem(product.id, Number(e.target.value.replace(/\D/g, '')) || 0)
                }
                className="h-7 w-0 min-w-6 flex-1 appearance-none border-0 bg-transparent px-0 text-center text-sm font-medium tabular-nums focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => inc(product.id)}
                className="flex size-7 shrink-0 items-center justify-center text-muted-foreground transition hover:bg-muted rounded-e-md"
                aria-label="Increase"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductImageProps {
  imageUrl: string | null;
  name: string;
}
function ProductImage({ imageUrl, name }: ProductImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!imageUrl || error)
    return (
      <div className="flex size-full items-center justify-center">
        <PackageIcon className="size-10 text-muted-foreground" />
      </div>
    );

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <Image
        src={imageUrl}
        alt={name}
        fill
        className={`object-cover transition-all duration-300 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes="(max-width: 768px) 100px, 200px"
        loading="eager"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
      />
    </>
  );
}
