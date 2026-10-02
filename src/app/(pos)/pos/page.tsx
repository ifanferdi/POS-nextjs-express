import { PosProductGridSkeleton } from '@/app/(pos)/_components/pos-product-grid-skeleton';
import { PosView } from '@/app/(pos)/_components/pos-view';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryOption, ProductDetail, ProductRelation } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { getAllProducts } from '@/features/products/api';
import { Suspense } from 'react';

export default async function PosPage() {
  return (
    <Suspense fallback={<PosViewSkeleton />}>
      <PosViewLoader />
    </Suspense>
  );
}

async function PosViewLoader() {
  const { data: products, total: totalProducts } = await getAllProducts<ProductDetail>({
    isActive: true,
    limit: 15,
    orderBy: ['name:asc'],
    with: [ProductRelation.CATEGORIES],
  });

  const { data: categories } = await getAllCategories<CategoryOption>({
    limit: -1,
    columns: ['id', 'name'],
    orderBy: ['name:asc'],
  });

  return <PosView products={products} totalProducts={totalProducts} categories={categories} />;
}

function PosViewSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[1fr_400px]">
      <section className="min-h-0 overflow-hidden">
        <PosProductGridSkeleton />
      </section>
      <aside className="hidden min-h-0 lg:max-h-[calc(100vh-7rem)] lg:block">
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1" />
          <div className="space-y-3 border-t border-border/60 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </aside>
    </div>
  );
}
