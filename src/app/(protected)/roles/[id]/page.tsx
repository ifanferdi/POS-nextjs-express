import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMockRoleById } from '@/app/(protected)/roles/_mock/data';

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = getMockRoleById(Number(id));

  if (!role) notFound();

  const permissions = role.permissions ?? [];
  const users = role.users;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/roles" aria-label="Back to Roles">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Role Detail</h1>
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{role.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {permissions.length} permission{permissions.length !== 1 ? 's' : ''} ·{' '}
                  {users.length} user{users.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Information
            </h3>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Role Name
                </dt>
                <dd className="text-sm">{role.name}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Created At
                </dt>
                <dd className="text-sm">{moment(role.createdAt).format('MMMM Do YYYY, HH:mm')}</dd>
              </div>
            </dl>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Permissions ({permissions.length})
            </h3>
            {permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((perm) => (
                  <span
                    key={perm.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    {perm.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Assigned Users ({users.length})
            </h3>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users assigned to this role.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {user.profile.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{user.profile.fullName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                    <span
                      className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          user.isActive ? 'bg-success' : 'bg-destructive'
                        }`}
                      />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            Role ID: <span className="font-mono">{role.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
