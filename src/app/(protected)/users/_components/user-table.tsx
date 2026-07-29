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
import { RoleOption, User } from '@/domain';
import { getAllUser } from '@/features/users/api';
import { GetAllUserParams } from '@/features/users/schema';
import { getInitials } from '@/lib/helper';
import _ from 'lodash';
import { UsersIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { UserPagination } from './user-pagination';

interface UsersTableSectionProps {
  params: GetAllUserParams;
  roles: RoleOption[];
}
export async function UsersTableSection({ params, roles }: UsersTableSectionProps) {
  const { data: users, ...meta } = await getAllUser(params);
  return (
    <>
      <UserTable users={users} roles={roles} />
      <UserPagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
    </>
  );
}

interface UserTableProps {
  users: Omit<User, 'permissions'>[];
  roles: RoleOption[];
}
function UserTable({ users, roles }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <UsersIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No users found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        {UserTableHeader}
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
                  <span className="font-medium group-hover:underline">{user.profile.fullName}</span>
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
                <span
                  className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400`}
                >
                  {user.role.name}
                </span>
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

export const UserTableHeader = (
  <>
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
  </>
);
