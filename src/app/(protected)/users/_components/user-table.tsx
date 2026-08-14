import { UserActions } from '@/app/(protected)/users/_components/user-actions';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable } from '@/components/shared/table-server';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleOption, User } from '@/domain';
import { getAllUser } from '@/features/users/api';
import { GetAllUserParams } from '@/features/users/schema';
import { getInitials } from '@/lib/helper';
import _ from 'lodash';
import moment from 'moment';

export const headers = ['#', 'Name', 'Username', 'Gender', 'Birth', 'Role', 'Status', ''];

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
    <DataTable
      headers={headers}
      records={users}
      cells={(user) => [
        {
          key: 'fullname',
          type: 'link',
          url: `/users/${user.id}`,
          content: (
            <>
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(user.profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium group-hover:underline">{user.profile.fullName}</span>
            </>
          ),
        },
        { key: 'username', type: 'custom', content: user.username },
        { key: 'gender', content: _.capitalize(user.profile.gender) },
        {
          key: 'birth',
          content: `${user.profile.placeOfBirth}, ${moment(user.profile.dateOfBirth).format('MMM D YYYY')}`,
        },
        { key: 'role', content: user.role.name },
        {
          key: 'status',
          type: 'custom',
          content: user.isActive ? (
            <Badge className="bg-success/10 text-success hover:bg-success/15">
              <span className="size-1.5 rounded-full bg-success" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              Inactive
            </Badge>
          ),
        },
        {
          key: 'action',
          type: 'custom',
          content: (
            <div className="flex justify-end gap-2">
              <UserActions user={user} roles={roles} />
            </div>
          ),
        },
      ]}
    />
  );
}
