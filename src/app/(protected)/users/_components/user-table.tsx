import { UserActions } from '@/app/(protected)/users/_components/user-actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Role, User } from '@/domain';
import { UsersIcon } from 'lucide-react';
import _ from 'lodash';
import moment from 'moment';
import Link from 'next/link';

type RoleOption = Pick<Role, 'id' | 'name'>;

interface UserTableProps {
  users: Omit<User, 'permissions'>[];
  roles: RoleOption[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserTable({ users, roles }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <UsersIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No users found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs text-muted-foreground">Name</TableHead>
            <TableHead className="text-xs text-muted-foreground">Username</TableHead>
            <TableHead className="text-xs text-muted-foreground">Gender</TableHead>
            <TableHead className="text-xs text-muted-foreground">Birth</TableHead>
            <TableHead className="text-xs text-muted-foreground">Role</TableHead>
            <TableHead className="text-xs text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-xs text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="group">
              <TableCell>
                <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(user.profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium group-hover:underline">
                    {user.profile.fullName}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.username}</TableCell>
              <TableCell className="text-muted-foreground">
                {_.capitalize(user.profile.gender)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {`${user.profile.placeOfBirth}, ${moment(user.profile.dateOfBirth).format('MMM D YYYY')}`}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role.name}</Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge className="bg-success/10 text-success hover:bg-success/15">
                    <span className="size-1.5 rounded-full bg-success" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <UserActions user={user} roles={roles} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
