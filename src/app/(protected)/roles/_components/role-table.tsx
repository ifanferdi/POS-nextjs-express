import { RoleActions } from '@/app/(protected)/roles/_components/role-actions';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Permission } from '@/domain';
import { ShieldCheckIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';

interface RoleTableRow {
  id: number;
  name: string;
  permissions: Permission[];
  userCount: number;
  createdAt: Date;
}

interface RoleTableProps {
  roles: RoleTableRow[];
  allPermissions: Permission[];
}

export function RoleTable({ roles, allPermissions }: RoleTableProps) {
  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldCheckIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No roles found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs text-muted-foreground">Role Name</TableHead>
            <TableHead className="text-xs text-muted-foreground">Permissions</TableHead>
            <TableHead className="text-xs text-muted-foreground">Users</TableHead>
            <TableHead className="text-xs text-muted-foreground">Created</TableHead>
            <TableHead className="text-right text-xs text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const visiblePerms = role.permissions.slice(0, 3);
            const remaining = role.permissions.length - visiblePerms.length;

            return (
              <TableRow key={role.id} className="group">
                <TableCell>
                  <Link
                    href={`/roles/${role.id}`}
                    className="font-medium group-hover:underline"
                  >
                    {role.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {role.permissions.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No permissions</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {visiblePerms.map((perm) => (
                        <span
                          key={perm.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          <span className="size-1.5 rounded-full bg-primary" />
                          {perm.name}
                        </span>
                      ))}
                      {remaining > 0 && (
                        <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
                          +{remaining} more
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {moment(role.createdAt).format('MMM D YYYY')}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <RoleActions
                      role={{
                        id: role.id,
                        name: role.name,
                        permissions: role.permissions,
                      }}
                      permissions={allPermissions}
                      userCount={role.userCount}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
