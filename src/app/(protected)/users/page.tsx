import { UserFormDialog } from '@/app/(protected)/users/_components/user-form-dialog';
import { UserTable } from '@/app/(protected)/users/_components/user-table';
import { UserRelation } from '@/domain';
import { getAllUser } from '@/features/users/api';
import { GetAllUserParams } from '@/features/users/schema';

interface UsersPageProps {
  searchParams: GetAllUserParams;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { data: users } = await getAllUser({
    ...(await searchParams),
    with: [UserRelation.PROFILE, UserRelation.ROLE],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <UserFormDialog mode={'create'} />
      </div>
      <UserTable users={users} />
    </div>
  );
}
