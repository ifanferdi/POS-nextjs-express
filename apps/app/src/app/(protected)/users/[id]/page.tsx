import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UserDetail, UserRelation } from '@/domain';
import { getUserById } from '@/features/users/api';
import { hasPermission, PERMISSION } from '@/lib/permission';
import _ from 'lodash';
import { ArrowLeftIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { forbidden } from 'next/navigation';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_USER, PERMISSION.SHOW_TRAINEE]))
    forbidden();

  const { id } = await params;
  const user = await getUserById<UserDetail>(Number(id), [UserRelation.PROFILE, UserRelation.ROLE]);

  const initials = user.profile.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const infoItems = [
    { label: 'Username', value: user.username },
    { label: 'Role', value: user.role.name },
    { label: 'Gender', value: _.capitalize(user.profile.gender) },
    { label: 'Place of Birth', value: user.profile.placeOfBirth },
    { label: 'Date of Birth', value: moment(user.profile.dateOfBirth).format('MMMM Do YYYY') },
    { label: 'Age', value: `${user.profile.age} years` },
    // { label: 'Created At', value: moment(user.createdAt).format('MMMM Do YYYY, HH:mm') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/users" aria-label="Back to Users">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">User Detail</h1>
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xl font-semibold">{initials}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{user.profile.fullName}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">@{user.username}</span>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item.label} className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Created at {moment(user.createdAt).format('MMMM D, YYYY, HH:mm')}</span>
            <span>Updated at {moment(user.updatedAt).format('MMMM D, YYYY, HH:mm')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
