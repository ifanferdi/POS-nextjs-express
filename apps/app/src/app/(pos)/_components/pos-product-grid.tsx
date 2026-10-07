'use client';

import { Button } from '@/components/shared/button';
import { Input } from '@/components/ui/input';
import { options } from '@/config/config';
import { CategoryOption, Product, ProductList, ProductRelation } from '@/domain';
import { getAllProductsAction } from '@/features/products/action';
import { useSSE } from '@/hooks/use-sse';
import { cn } from '@/lib/utils';
import _ from 'lodash';
import { SearchIcon, XIcon } from 'lucide-react';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CartItem, useCartStore } from '../../../store/pos-cart-store';
import { ProductCard } from './pos-product-card';
import { SkeletonCard } from './pos-product-grid-skeleton';

const PAGE_SIZE = options.posProductLength;

interface PosProductGridProps {
  products: ProductList[];
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
  const [products, setProducts] = useState<ProductList[]>(initialProducts);
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

  useSSE<Product>({
    events: ['product.create', 'product.update', 'product.delete'],
    onEvent: ({ action, data }) => {
      if (['create', 'update', 'delete'].includes(action))
        setProducts((products) =>
          products.map((product) => {
            const currentProduct = _.find(data, { id: product.id });
            if (currentProduct && product.id === currentProduct.id)
              return { ...product, stock: currentProduct.stock };

            return product;
          }),
        );
    },
  });

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

  const hasMore = products.length < total;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    getAllProductsAction<ProductList>({
      isActive: true,
      page: Math.ceil(products.length / PAGE_SIZE) + 1,
      limit: PAGE_SIZE,
      orderBy: ['name:asc'],
      with: [ProductRelation.CATEGORIES],
    })
      .then(({ data: newProducts, total: newTotal }) => {
        setProducts([...products, ...newProducts]);
        setTotal(newTotal);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, products]);

  useLoadingOnScroll(loadMore, isLoadingMore, hasMore, sentinelRef, scrollRef);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 pb-2">
        <div className="relative">
          <SearchIcon
            id="search-product"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground not-focus-visible"
          />
          <Input
            placeholder="Search products..."
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
            aria-label="Find category"
          >
            <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <Input
              ref={catInputRef}
              placeholder={expandSearchCategory ? 'Category...' : ''}
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
                aria-label="Close category search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none">
            <CategoryPill active={selectedCategories.size === 0} onClick={handleAll}>
              All
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

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 && !isLoadingMore ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No products.</div>
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
              <div ref={sentinelRef} className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className="bg-theme"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
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

function useLoadingOnScroll(
  loadMore: () => void,
  isLoadingMore: boolean,
  hasMore: boolean,
  sentinelRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (isLoadingMore || !hasMore) return;

    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root) return;

    let timeout: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          clearTimeout(timeout);
          timeout = setTimeout(loadMore, 500);
        }
      },
      { root, rootMargin: '100px' },
    );
    observer.observe(sentinel);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [loadMore, isLoadingMore, hasMore, sentinelRef, scrollRef]);
}
