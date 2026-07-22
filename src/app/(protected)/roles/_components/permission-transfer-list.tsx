'use client';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Permission } from '@/domain';
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

interface PermissionTransferListProps {
  permissions: Permission[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

function getGroup(name: string): string {
  const prefix = name.split(':')[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function groupPermissions(permissions: Permission[]): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();
  for (const perm of permissions) {
    const group = getGroup(perm.name);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(perm);
  }
  return groups;
}

export function PermissionTransferList({
  permissions,
  selectedIds,
  onChange,
}: PermissionTransferListProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const available = useMemo(
    () =>
      permissions
        .filter((p) => !selectedIds.includes(p.id))
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [permissions, selectedIds, search],
  );

  const selected = useMemo(
    () => permissions.filter((p) => selectedIds.includes(p.id)),
    [permissions, selectedIds],
  );

  const availableGroups = useMemo(() => groupPermissions(available), [available]);
  const selectedGroups = useMemo(() => groupPermissions(selected), [selected]);

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function add(id: number) {
    onChange([...selectedIds, id]);
  }

  function addGroup(permIds: number[]) {
    onChange([...selectedIds, ...permIds.filter((id) => !selectedIds.includes(id))]);
  }

  function remove(id: number) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  function removeGroup(permIds: number[]) {
    const idSet = new Set(permIds);
    onChange(selectedIds.filter((id) => !idSet.has(id)));
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Available */}
      <div className="flex max-h-80 flex-col overflow-hidden rounded-lg border border-border/60">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Available
          </span>
          <span className="text-xs text-muted-foreground">{available.length} items</span>
        </div>
        <div className="border-b border-border/60 p-2">
          <InputGroup className="w-full">
            <InputGroupInput
              placeholder="Filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />
            <SearchIcon className="absolute right-2.5 size-4 text-muted-foreground" />
          </InputGroup>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {available.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              All permissions assigned
            </p>
          ) : (
            Array.from(availableGroups.entries()).map(([group, perms]) => {
              const isCollapsed = collapsed.has(group);
              return (
                <div key={group}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <ChevronDownIcon
                        className={`size-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                      <span>{group}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addGroup(perms.map((p) => p.id))}
                      className="ml-auto flex items-center gap-1.5 font-normal text-muted-foreground/70 transition-colors hover:text-primary"
                      title={`Select all ${perms.length} in ${group}`}
                    >
                      <span>{perms.length}</span>
                      <span className="flex size-4 items-center justify-center rounded border border-border transition-colors hover:border-primary">
                        <CheckIcon className="size-3 text-primary opacity-0" />
                      </span>
                    </button>
                  </div>
                  {!isCollapsed &&
                    perms.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => add(perm.id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 pl-7 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="size-4 shrink-0 rounded border border-border" />
                        <span>{perm.name}</span>
                      </button>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected */}
      <div className="flex max-h-80 flex-col overflow-hidden rounded-lg border border-border/60">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted px-3.5 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Selected
          </span>
          <span className="text-xs text-muted-foreground">{selected.length} items</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {selected.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No permissions selected
            </p>
          ) : (
            Array.from(selectedGroups.entries()).map(([group, perms]) => {
              const isCollapsed = collapsed.has(group);
              return (
                <div key={group}>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      <ChevronDownIcon
                        className={`size-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      />
                      <span>{group}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGroup(perms.map((p) => p.id))}
                      className="ml-auto flex items-center gap-1.5 font-normal text-muted-foreground/70 transition-colors hover:text-destructive"
                      title={`Remove all ${perms.length} from ${group}`}
                    >
                      <span>{perms.length}</span>
                      <XIcon className="size-3.5 opacity-60" />
                    </button>
                  </div>
                  {!isCollapsed &&
                    perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="group flex items-center gap-2 px-3 py-1.5 pl-7 text-sm transition-colors hover:bg-destructive/5"
                      >
                        <CheckIcon className="size-4 shrink-0 text-primary" />
                        <span>{perm.name}</span>
                        <button
                          type="button"
                          onClick={() => remove(perm.id)}
                          className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                          aria-label={`Remove ${perm.name}`}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
