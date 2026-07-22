import { UserFilter } from '@/app/(protected)/users/_components/user-filter';
import { UserFormDialog } from '@/app/(protected)/users/_components/user-form-dialog';
import { UserPagination } from '@/app/(protected)/users/_components/user-pagination';
import { UserSearch } from '@/app/(protected)/users/_components/user-search';
import { UserTable } from '@/app/(protected)/users/_components/user-table';
import { Role, UserRelation } from '@/domain';
import { getAllRoles } from '@/features/roles/api';
import { getAllUser } from '@/features/users/api';
import { GetAllUserParams } from '@/features/users/schema';
import { Suspense } from 'react';

type RoleOption = Pick<Role, 'id' | 'name'>;

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
    roleId?: string;
    isActive?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { page, limit, q, roleId, isActive } = await searchParams;
  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 10);
  const roleIdNum = roleId ? Number(roleId) : undefined;
  const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const params: GetAllUserParams = {
    page: pageNum,
    limit: limitNum,
    q,
    roleId: roleIdNum,
    isActive: isActiveBool,
    with: [UserRelation.PROFILE, UserRelation.ROLE],
  };

  const [{ data: users, ...meta }, roles] = await Promise.all([getAllUser(params), getAllRoles()]);

  const roleOptions: RoleOption[] = roles.map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application users</p>
        </div>
        <UserFormDialog mode="create" roles={roleOptions} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={null}>
          <UserSearch />
        </Suspense>
        <Suspense fallback={null}>
          <UserFilter roles={roleOptions} />
        </Suspense>
      </div>
      <UserTable users={users} roles={roleOptions} />
      <UserPagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
    </div>
  );
}
