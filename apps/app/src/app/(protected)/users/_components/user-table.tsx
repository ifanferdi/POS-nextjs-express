'use client';

import { UserActions } from '@/app/(protected)/users/_components/user-actions';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable, ErrorTable } from '@/components/shared/table-server';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleOption, UserList, UserRelation } from '@/domain';
import { getAllUsersAction } from '@/features/users/action';
import { GetAllUserParams } from '@/features/users/schema';
import { getInitials } from '@/lib/helper';
import { orderKeys } from '@/lib/tenstack-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import moment from 'moment';
import { UserSearchParams } from '../page';
import { UserTableSkeleton } from './user-table-skeleton';

export const headers = ['#', 'Name', 'Username', 'Gender', 'Birth', 'Role', 'Status', ''];

interface UserTableSectionProps {
  searchParams: UserSearchParams;
  roles: RoleOption[];
  canManage: boolean;
}
export function UserTableSection(props: UserTableSectionProps) {
  const { searchParams, roles, canManage } = props;
  const { page, q, roleId, isActive } = searchParams;

  const pageNum = Number(page ?? 1);
  const roleIdNum = roleId ? Number(roleId) : undefined;
  const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const params: GetAllUserParams = {
    page: pageNum,
    q,
    roleId: roleIdNum,
    isActive: isActiveBool,
    with: [UserRelation.PROFILE, UserRelation.ROLE],
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: orderKeys.all(params),
    queryFn: () => getAllUsersAction<UserList>(params),
    placeholderData: keepPreviousData,
  });
  if (isPending) return <UserTableSkeleton />;
  if (isError) return <ErrorTable headers={headers} entities="users" onRetry={() => refetch()} />;

  const { data: users, ...meta } = data;

  return (
    <>
      <UserTable users={users} roles={roles} canManage={canManage} />
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
  users: UserList[];
  roles: RoleOption[];
  canManage: boolean;
}
function UserTable(props: UserTableProps) {
  const { users, roles, canManage } = props;
  if (users.length === 0) return <EmptyTable entities="users" icon="user" headers={headers} />;

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
        {
          key: 'username',
          type: 'custom',
          content: user.username,
          className: 'text-muted-foreground',
        },
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
            <Badge className="bg-success/15 text-success hover:bg-success/30">
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
              <UserActions user={user} roles={roles} canManage={canManage} />
            </div>
          ),
        },
      ]}
    />
  );
}
