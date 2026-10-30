import { UserFilter } from '@/app/(protected)/users/_components/user-filter';
import { UserFormDialog } from '@/app/(protected)/users/_components/user-form-dialog';
import { UserSearch } from '@/app/(protected)/users/_components/user-search';
import { UserTableSection } from '@/app/(protected)/users/_components/user-table';
import { auth } from '@/auth';
import { RoleOption } from '@/domain';
import { getAllRoles } from '@/features/roles/api';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';

export interface UserSearchParams {
  page?: string;
  q?: string;
  roleId?: string;
  isActive?: string;
}
interface UsersPageProps {
  searchParams: Promise<UserSearchParams>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_USER])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_USER]);

  const { data: roles } = await getAllRoles<RoleOption>({
    limit: -1,
    columns: ['id', 'name'],
    orderBy: ['name:asc'],
  });

  return (
    <div className="space-y-6">
      {/* {!result.success && <ParamsError errors={z.flattenError(result.error).fieldErrors} />} */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application users</p>
        </div>
        {canManage && <UserFormDialog mode="create" roles={roles} />}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <UserSearch />
        <UserFilter roles={roles} />
      </div>
      <UserTableSection searchParams={await searchParams} roles={roles} canManage={canManage} />
    </div>
  );
}
