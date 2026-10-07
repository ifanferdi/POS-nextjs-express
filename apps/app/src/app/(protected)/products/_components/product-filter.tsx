'use client';

import {
  DefaultFilter,
  Filter,
  MultiSelectSearchFilter,
  MultiSelectSearchItemsProps,
} from '@/components/shared/filter';
import { icons, options } from '@/config/config';
import { CategoryOption } from '@/domain';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

interface ProductFilterProps {
  categories: CategoryOption[];
}

export function ProductFilter({ categories }: ProductFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [categoryQuery, setCategoryQuery] = useState('');

  const currentCategoryIds = searchParams.getAll('categoryId[]');
  const currentIsActive = searchParams.get('isActive');
  const hasActiveFilter = Boolean(currentCategoryIds.length || currentIsActive);

  const filteredCategories = useMemo(() => {
    const filteredItems: MultiSelectSearchItemsProps[] = categories.map((category) => ({
      key: category.id,
      label: category.name,
    }));

    const q = categoryQuery.trim().toLowerCase();
    return q ? filteredItems.filter((c) => c.label.toLowerCase().includes(q)) : filteredItems;
  }, [categories, categoryQuery]);

  function pushParams(params: URLSearchParams) {
    params.set('page', '1');
    startTransition(() => router.push(`/products?${params.toString()}`));
  }

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    pushParams(params);
  }

  function toggleCategory(key: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId[]');
    const current = currentCategoryIds.map(Number);
    const next = current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
    next.forEach((v) => params.append('categoryId[]', String(v)));

    pushParams(params);
  }

  function resetFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId[]');
    params.delete('isActive');
    setCategoryQuery('');
    pushParams(params);
  }

  return (
    <Filter hasActiveFilter={hasActiveFilter} resetFilter={resetFilter}>
      <DefaultFilter
        activeFilter={currentIsActive}
        labelComponent={
          <>
            <icons.isActive />
            <span>Status</span>
          </>
        }
        onChangeFunction={(v) => updateParam('isActive', v === 'all' ? null : v)}
        placeholderItem="All Status"
        items={options.activeOptions.map((option) => ({ key: option.value, label: option.label }))}
      />
      <MultiSelectSearchFilter
        activeFilter={currentIsActive}
        labelComponent={
          <>
            <icons.category />
            <span>Category</span>
          </>
        }
        query={categoryQuery}
        setQuery={setCategoryQuery}
        items={filteredCategories}
        selectedItemsKeys={currentCategoryIds}
        onChangeFunction={(e) => setCategoryQuery(e.target.value)}
        toggleChange={(key: number | string) => toggleCategory(key as number)}
      />
    </Filter>
  );
}
