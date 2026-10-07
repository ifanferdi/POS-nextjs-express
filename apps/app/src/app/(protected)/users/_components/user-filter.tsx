'use client';

import { DefaultFilter, Filter } from '@/components/shared/filter';
import { icons, options } from '@/config/config';
import { Role } from '@/domain';
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
  const hasActiveFilter = Boolean(currentRoleId || currentIsActive);

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
    <Filter hasActiveFilter={hasActiveFilter} resetFilter={resetFilter}>
      <DefaultFilter
        activeFilter={currentRoleId}
        labelComponent={
          <>
            <icons.role />
            <span>Role</span>
          </>
        }
        onChangeFunction={(v) => updateParam('roleId', v === 'all' ? null : v)}
        placeholderItem="All Roles"
        items={roles.map((role) => ({ key: role.id, label: role.name }))}
      />
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
    </Filter>
  );
}
