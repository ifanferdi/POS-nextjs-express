'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
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
import { options } from '@/config/config';
import { Role } from '@/domain';
import { CircleDotIcon, FilterIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type RoleOption = Pick<Role, 'id' | 'name'>;

interface UserFilterProps {
  roles: RoleOption[];
}

export function UserFilter({ roles }: UserFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentRoleId = searchParams.get('roleId');
  const currentIsActive = searchParams.get('isActive');
  const hasFilter = Boolean(currentRoleId || currentIsActive);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    startTransition(() => router.push(`/users?${params.toString()}`));
  }

  function resetFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('roleId');
    params.delete('isActive');
    params.set('page', '1');
    startTransition(() => router.push(`/users?${params.toString()}`));
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
          <DropdownMenuSubTrigger className={`cursor-pointer ${currentRoleId && 'bg-muted'}`}>
            <ShieldCheckIcon />
            <span>Role</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={currentRoleId ?? 'all'}
              onValueChange={(v) => updateParam('roleId', v === 'all' ? null : v)}
            >
              <DropdownMenuRadioItem value="all">All Roles</DropdownMenuRadioItem>
              {roles.map((role) => (
                <DropdownMenuRadioItem
                  key={role.id}
                  value={String(role.id)}
                  className={`cursor-pointer ${role.id.toString() === currentRoleId && 'bg-muted'}`}
                >
                  {role.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
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
