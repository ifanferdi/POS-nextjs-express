'use client';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Loader2Icon, SearchIcon, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

export function RoleSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const pushSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (q) {
        params.set('page', '1');
        params.set('q', q);
      } else {
        params.delete('page');
        params.delete('q');
      }
      startTransition(() => router.push(`/roles?${params.toString()}`));
    },
    [router],
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushSearch(value), 500);
    return () => clearTimeout(debounceRef.current);
  }, [value, pushSearch]);

  function handleEnter() {
    clearTimeout(debounceRef.current);
    pushSearch(value);
  }

  function searchIcon() {
    const className = 'absolute right-2.5 size-4 text-muted-foreground';
    if (value !== '') {
      return (
        <X
          className={`${className} cursor-pointer hover:text-foreground`}
          onClick={() => (setValue(''), pushSearch(''))}
          aria-label="Clear search"
        />
      );
    } else {
      if (isPending) return <Loader2Icon className={`${className} animate-spin`} />;
      else return <SearchIcon className={className} />;
    }
  }

  return (
    <InputGroup className="w-full sm:w-96 sm:text-lg">
      <InputGroupInput
        placeholder="Search roles..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleEnter();
        }}
        readOnly={isPending}
      />
      {searchIcon()}
    </InputGroup>
  );
}
