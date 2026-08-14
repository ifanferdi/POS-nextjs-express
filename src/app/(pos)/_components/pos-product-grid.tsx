'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryOption, Product } from '@/domain';
import { fetchProductsAction } from '@/features/products/action';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { MinusIcon, PackageIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 15;

interface PosProductGridProps {
  products: Product[];
  totalProducts: number;
  categories: CategoryOption[];
  onAdd: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
}

export function PosProductGrid({
  products: initialProducts,
  totalProducts: initialTotal,
  categories,
  onAdd,
}: PosProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState<number>(initialTotal);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [expandSearchCategory, setExpandSearchCategory] = useState(false);
  const [focus, setFocus] = useState(false);
  const [catForceCollapsed, setCatForceCollapsed] = useState(false);
  const catInputRef = useRef<HTMLInputElement>(null);
  const catExpanded = !catForceCollapsed && expandSearchCategory;
  const items = useCartStore((s) => s.items);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [categories, categoryQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery = !q || p.name.toLowerCase().includes(q);
      const matchCategory =
        selectedCategories.size === 0 || p.categories?.some((c) => selectedCategories.has(c.id));
      return matchQuery && matchCategory;
    });
  }, [products, query, selectedCategories]);

  function toggleCategory(id: number) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAll() {
    setSelectedCategories(new Set());
    setCategoryQuery('');
    setExpandSearchCategory(false);
  }

  // ponytail: search kategori collapsible. Hover-expand + X-collapse.
  function handleCatEnter() {
    setExpandSearchCategory(true);
    setCatForceCollapsed(false);
  }
  function handleCatLeave() {
    if (categoryQuery === '' && !focus) setExpandSearchCategory(false);
  }
  function handleCatMinimize() {
    setCatForceCollapsed(true);
    setFocus(false);
    catInputRef.current?.blur();
    setCategoryQuery('');
  }

  // ponytail: load-more via IntersectionObserver sentinel.
  // Paginasi pakai cumulative limit (15→30→45...) — tiap fetch re-load early items,
  // simple tapi boros bandwidth saat backend throughput besar.
  // Upgrade path: pakai page-offset pagination (page=N, limit=15) kalau backend load berat.
  // setState di observer callback = subscribe external system → lolos react-hooks rule.
  const hasMore = products.length < total;
  useEffect(() => {
    if (isLoadingMore || !hasMore) return;

    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore(true);
          fetchProductsAction(products.length + PAGE_SIZE)
            .then(({ products: newProducts, total: newTotal }) => {
              setProducts(newProducts);
              setTotal(newTotal);
            })
            .catch((err) => {
              toast.error(err instanceof Error ? err.message : 'Gagal memuat produk.');
            })
            .finally(() => setIsLoadingMore(false));
        }
      },
      { root, rootMargin: '100px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products.length, isLoadingMore, hasMore]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="space-y-2">
        <div className="relative">
          <SearchIcon
            id="search-product"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground not-focus-visible"
          />
          <Input
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-8"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'relative flex h-8 shrink-0 cursor-pointer items-center rounded-md transition-all duration-300',
              catExpanded ? 'w-40' : 'w-8',
            )}
            onFocus={() => (setExpandSearchCategory(true), setFocus(true))}
            onMouseEnter={handleCatEnter}
            onMouseLeave={handleCatLeave}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                // setFocus(false);
                setExpandSearchCategory(false);
              }
            }}
            role="button"
            tabIndex={-1}
            aria-label="Cari kategori"
          >
            <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <Input
              ref={catInputRef}
              placeholder={expandSearchCategory ? 'Kategori...' : ''}
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'h-8 text-xs!',
                catExpanded ? 'opacity-100 px-7' : 'pointer-events-none px-3',
              )}
            />
            {expandSearchCategory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCatMinimize();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute right-1 flex size-6 items-center justify-center text-muted-foreground transition hover:text-foreground h-full"
                aria-label="Tutup pencarian kategori"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-1 gap-1.5 overflow-x-auto">
            <CategoryPill active={selectedCategories.size === 0} onClick={handleAll}>
              Semua
            </CategoryPill>
            {filteredCategories.map((c) => (
              <CategoryPill
                key={c.id}
                active={selectedCategories.has(c.id)}
                onClick={() => toggleCategory(c.id)}
              >
                {c.name}
              </CategoryPill>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 && !isLoadingMore ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Tidak ada produk ditemukan.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} items={items} onAdd={onAdd} />
              ))}
              {isLoadingMore &&
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="py-4 text-center text-xs text-muted-foreground">
                {isLoadingMore ? 'Memuat lebih banyak…' : 'Gulir untuk lebih'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/60">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-1 h-7 w-full" />
      </div>
    </div>
  );
}

interface ProductImageProps {
  imageUrl: string | null;
  name: string;
}
function ProductImage({ imageUrl, name }: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!imageUrl)
    return (
      <div className="flex size-full items-center justify-center">
        <PackageIcon className="size-10 text-muted-foreground/50" />
      </div>
    );

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill // ← otomatis isi container
      className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      sizes="(max-width: 768px) 100px, 200px"
      loading="lazy"
      onLoad={() => setIsLoading(false)}
      onError={() => setIsLoading(false)}
    />
  );
}

function ProductCard({
  product,
  items,
  onAdd,
}: {
  product: Product;
  items: CartItem[];
  onAdd: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
}) {
  const add = onAdd;
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);

  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;
  const added = qty > 0;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border transition-colors',
        added ? 'border-primary ring-2 ring-primary/20' : 'border-border/60 hover:border-border',
      )}
    >
      <div className="relative aspect-square w-full bg-muted">
        <ProductImage imageUrl={product.imageUrl} name={product.name} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
        <p className="text-sm font-semibold text-primary" suppressHydrationWarning>
          {formatCurrency(product.price)}
        </p>
        <p className="text-xs text-muted-foreground">Stok: {product.stock}</p>

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
            className="mt-1 w-full"
          >
            + Tambah
          </Button>
        ) : (
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => remove(product.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-muted hover:text-destructive"
              aria-label="Hapus dari keranjang"
            >
              <XIcon className="size-3.5" />
            </button>
            <div className="flex flex-1 items-center justify-between rounded-md border border-border/60">
              <button
                type="button"
                onClick={() => dec(product.id)}
                className="flex size-7 items-center justify-center text-muted-foreground transition hover:bg-muted"
                aria-label="Kurangi"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <span className="min-w-6 text-center text-sm font-medium tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => inc(product.id)}
                className="flex size-7 items-center justify-center text-muted-foreground transition hover:bg-muted"
                aria-label="Tambah"
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

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
    >
      {children}
    </button>
  );
}
