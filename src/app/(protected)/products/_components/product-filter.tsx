'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { options } from '@/config/config';
import { Category, CategoryOption } from '@/domain';
import { CircleDotIcon, FilterIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
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
  const hasFilter = Boolean(currentCategoryIds.length || currentIsActive);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
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

  function toggleCategory(id: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId[]');
    const current = currentCategoryIds.map(Number);
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    next.forEach((v) => params.append('categoryId[]', String(v)));
    pushParams(params);
  }

  function resetFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId[]');
    params.delete('isActive');
    pushParams(params);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`${hasFilter && 'border-primary'}`}>
          <FilterIcon />
          <span>Filter</span>
          {hasFilter && <span className="ml-1 size-1.5 rounded-full bg-primary" aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className={`cursor-pointer ${currentCategoryIds.length > 0 && 'bg-muted'}`}
          >
            <ShieldCheckIcon />
            <span>Category</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <div className="p-1">
              <Input
                placeholder="Search categories..."
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-8"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No results.
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={currentCategoryIds.includes(String(category.id))}
                    onCheckedChange={() => toggleCategory(category.id)}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <CircleDotIcon />
            <span>Status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={currentIsActive ?? 'all'}
              onValueChange={(v) => updateParam('isActive', v === 'all' ? null : v)}
            >
              <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
              {options.activeOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className={`cursor-pointer ${option.value === currentIsActive && 'bg-muted'}`}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {hasFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={resetFilter}
              className="cursor-pointer"
            >
              <XIcon />
              <span>Clear Filter</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
