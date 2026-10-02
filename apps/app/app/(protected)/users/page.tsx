import { UserFilter } from '@/app/(protected)/users/_components/user-filter';
import { UserFormDialog } from '@/app/(protected)/users/_components/user-form-dialog';
import { UserSearch } from '@/app/(protected)/users/_components/user-search';
import { UserTableSection } from '@/app/(protected)/users/_components/user-table';
import { UserTableSkeleton } from '@/app/(protected)/users/_components/user-table-skeleton';
import { ParamsError } from '@/components/shared/error';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleOption, UserRelation } from '@/domain';
import { getAllRoles } from '@/features/roles/api';
import { GetAllUserParams, GetAllUserSchema } from '@/features/users/schema';
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
  const { page, q, roleId, isActive } = await searchParams;
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

  const result = GetAllUserSchema.safeParse(params);

  const { data: roles } = await getAllRoles<RoleOption>({
    limit: -1,
    columns: ['id', 'name'],
    orderBy: ['name:asc'],
  });

  return (
    <div className="space-y-6">
      {!result.success && <ParamsError errors={z.flattenError(result.error).fieldErrors} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application users</p>
        </div>
        <UserFormDialog mode="create" roles={roles} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<Skeleton className="h-9 w-full sm:w-72" />}>
          <UserSearch />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-9 w-24" />}>
          <UserFilter roles={roles} />
        </Suspense>
      </div>
      <Suspense fallback={<UserTableSkeleton />}>
        <UserTableSection params={params} roles={roles} />
      </Suspense>
    </div>
  );
}
