import { UserActions } from '@/app/(protected)/users/_components/user-actions';
import { EmptyTable, TablePagination } from '@/components/shared/table';
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
import moment from 'moment';
import Link from 'next/link';

interface UserTableSectionProps {
  params: GetAllUserParams;
  roles: RoleOption[];
}
export async function UserTableSection(props: UserTableSectionProps) {
  const { params, roles } = props;
  const { data: users, ...meta } = await getAllUser(params);
  return (
    <>
      <UserTable users={users} roles={roles} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/users"
      />
    </>
  );
}

interface UserTableProps {
  users: Omit<User, 'permissions'>[];
  roles: RoleOption[];
}
function UserTable(props: UserTableProps) {
  const { users, roles } = props;
  if (users.length === 0) return <EmptyTable entities="users" icon="user" />;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <UserTableHeader />
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.id} className="group">
              <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
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
              <TableCell className="text-muted-foreground">{user.role.name}</TableCell>
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
              <TableCell className="w-0">
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

export function UserTableHeader() {
  const HEADERS = ['#', 'Name', 'Username', 'Gender', 'Birth', 'Role', 'Status'];
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        {HEADERS.map((header) => (
          <TableHead
            key={header}
            className={`text-xs text-muted-foreground ${header === '#' ? 'w-0 px-3 text-center' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
