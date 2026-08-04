import { Button } from '@/components/shared/button';
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
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { FilterIcon, X, XIcon } from 'lucide-react';
import { ChangeEventHandler, Dispatch, JSX, SetStateAction } from 'react';

export function Filter({
  hasActiveFilter,
  filterLabel = 'Filter',
  filterSubLabel = 'Filter by',
  children,
  resetFilter,
}: {
  hasActiveFilter: boolean;
  filterLabel?: string;
  filterSubLabel?: string | null;
  resetFilter: () => void;
  children?: JSX.Element | JSX.Element[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'outline'}
          className={`min-w-20 ${hasActiveFilter ? 'border-primary' : ''}`}
        >
          <FilterIcon />
          <span>{filterLabel}</span>
          {hasActiveFilter && (
            <span className="ml-1 size-1.5 rounded-full bg-primary" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-42">
        {filterSubLabel !== null && (
          <>
            <DropdownMenuLabel>{filterSubLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {children}
        {hasActiveFilter && (
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

export function DefaultFilter({
  activeFilter,
  labelComponent,
  onChangeFunction,
  placeholderItem = null,
  items,
}: {
  activeFilter: string | null;
  labelComponent: JSX.Element;
  onChangeFunction: (value: string) => void;
  placeholderItem: string | null;
  items: { key: number | string; label: string }[];
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={`cursor-pointer ${activeFilter && 'bg-muted'}`}>
        {labelComponent}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={'min-w-38'}>
        <DropdownMenuRadioGroup value={activeFilter ?? 'all'} onValueChange={onChangeFunction}>
          {placeholderItem && (
            <DropdownMenuRadioItem
              value="all"
              className={`cursor-pointer ${(activeFilter === 'all' || !activeFilter) && 'bg-muted-foreground/20 dark:bg-muted'}`}
            >
              All Roles
            </DropdownMenuRadioItem>
          )}
          {items.map((item) => (
            <DropdownMenuRadioItem
              key={item.key}
              value={String(item.key)}
              className={`cursor-pointer ${item.key.toString() === activeFilter && 'bg-muted-foreground/20 dark:bg-muted'}`}
            >
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export interface MultiSelectSearchItemsProps {
  key: number | string;
  label: string;
}
export function MultiSelectSearchFilter({
  activeFilter,
  labelComponent,
  query,
  setQuery,
  items,
  selectedItemsKeys,
  onChangeFunction,
  toggleChange,
}: {
  activeFilter: string | null;
  labelComponent: JSX.Element;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  items: MultiSelectSearchItemsProps[];
  selectedItemsKeys: string[];
  onChangeFunction: ChangeEventHandler<HTMLInputElement, HTMLInputElement>;
  toggleChange: (key: number | string) => void;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={`cursor-pointer ${activeFilter && 'bg-muted'}`}>
        {labelComponent}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={'min-w-38'}>
        <div className="p-1">
          <InputGroup>
            <InputGroupInput
              placeholder="Search..."
              value={query}
              onChange={onChangeFunction}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-8"
            />
            {query !== '' && (
              <X
                className={`absolute right-2.5 size-4 text-muted-foreground cursor-pointer hover:text-foreground`}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              />
            )}
          </InputGroup>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No results.</div>
          ) : (
            items.map((item) => (
              <DropdownMenuCheckboxItem
                key={item.key}
                checked={selectedItemsKeys.includes(String(item.key))}
                onCheckedChange={() => toggleChange(item.key)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                {item.label}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
