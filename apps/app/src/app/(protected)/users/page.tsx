import { UserFilter } from '@/app/(protected)/users/_components/user-filter';
import { UserFormDialog } from '@/app/(protected)/users/_components/user-form-dialog';
import { UserSearch } from '@/app/(protected)/users/_components/user-search';
import {
  headers as userHeaders,
  UserTableSection,
} from '@/app/(protected)/users/_components/user-table';
import { UserTableSkeleton } from '@/app/(protected)/users/_components/user-table-skeleton';
import { auth } from '@/auth';
import { ParamsError } from '@/components/shared/error';
import { ErrorTable } from '@/components/shared/table-server';
import { RoleOption, UserRelation } from '@/domain';
import { getAllRoles } from '@/features/roles/api';
import { GetAllUserSchema } from '@/features/users/schema';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';
import z from 'zod';

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    roleId?: string;
    isActive?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_USER])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_USER]);

  const { page, q, roleId, isActive } = await searchParams;
  const pageNum = Number(page ?? 1);
  const roleIdNum = roleId ? Number(roleId) : undefined;
  const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const result = GetAllUserSchema.safeParse({
    page: pageNum,
    q,
    roleId: roleIdNum,
    isActive: isActiveBool,
    with: [UserRelation.PROFILE, UserRelation.ROLE],
  });

  const { data: roles } = await getAllRoles<RoleOption>({
    limit: -1,
    columns: ['id', 'name'],
    orderBy: ['name:asc'],
  });

  const isDeveloper = session?.user?.role?.name === 'Developer';
  const roleOptions = isDeveloper ? roles : roles.filter((role) => role.name !== 'Developer');

  return (
    <div className="space-y-6">
      {!result.success && <ParamsError errors={z.flattenError(result.error).fieldErrors} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application users</p>
        </div>
        {canManage && <UserFormDialog mode="create" roles={roleOptions} />}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <UserSearch />
        <UserFilter roles={roles} />
      </div>
      {result.success ? (
        <Suspense fallback={<UserTableSkeleton />}>
          <UserTableSection params={result.data} roles={roleOptions} canManage={canManage} />
        </Suspense>
      ) : (
        <ErrorTable headers={userHeaders} recoveryHref="/users" />
      )}
    </div>
  );
}
