import { RoleFormDialog } from '@/app/(protected)/roles/_components/role-form-dialog';
import { RolePagination } from '@/app/(protected)/roles/_components/role-pagination';
import { RoleSearch } from '@/app/(protected)/roles/_components/role-search';
import { RoleTable } from '@/app/(protected)/roles/_components/role-table';
import { mockPermissions, mockRolesWithUsers } from '@/app/(protected)/roles/_mock/data';
import { Suspense } from 'react';

interface RolesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
  }>;
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const { page, limit, q } = await searchParams;
  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 10);

  const filtered = q
    ? mockRolesWithUsers.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    : mockRolesWithUsers;

  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const start = (pageNum - 1) * limitNum;
  const paged = filtered.slice(start, start + limitNum);

  const tableData = paged.map((role) => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions ?? [],
    userCount: role.users.length,
    createdAt: role.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage roles and their assigned permissions
          </p>
        </div>
        <RoleFormDialog mode="create" permissions={mockPermissions} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={null}>
          <RoleSearch />
        </Suspense>
      </div>
      <RoleTable roles={tableData} allPermissions={mockPermissions} />
      <RolePagination page={pageNum} totalPages={totalPages} total={total} />
    </div>
  );
}
