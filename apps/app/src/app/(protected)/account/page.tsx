import { AccountPasswordDialog } from '@/app/(protected)/account/_components/account-password-dialog';
import { AccountProfileDialog } from '@/app/(protected)/account/_components/account-profile-dialog';
import { auth, getMeCached } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helper';
import _ from 'lodash';
import { KeyRoundIcon, ShieldCheckIcon } from 'lucide-react';
import moment from 'moment';
import { redirect } from 'next/navigation';

const glass =
  'rounded-3xl border border-white/50 bg-white/60 shadow-xl shadow-primary/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20';

const glassChip =
  'inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/50 px-2.5 py-1 text-xs font-medium backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.accessToken) redirect('/login');

  const me = await getMeCached(session.accessToken);
  const profile = me.profile;

  const infoItems = [
    { label: 'Username', value: me.username },
    { label: 'Email', value: me.email },
    { label: 'Gender', value: profile?.gender ? _.capitalize(profile.gender) : '-' },
    { label: 'Place of Birth', value: profile?.placeOfBirth || '-' },
    {
      label: 'Date of Birth',
      value: profile?.dateOfBirth ? moment(profile.dateOfBirth).format('MMMM Do YYYY') : '-',
    },
    { label: 'Age', value: profile?.age ? `${profile.age} years` : '-' },
  ];

  return (
    <div className="relative isolate space-y-6">
      <div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">My Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and security
        </p>
      </div>

      <section className={glass}>
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="rounded-full bg-linear-to-br from-primary via-info to-primary p-0.75 shadow-lg shadow-primary/20">
              <Avatar size="lg" className="size-20 ring-4 ring-white/60 dark:ring-white/10">
                {profile?.imageUrl && <AvatarImage src={profile.imageUrl} alt={me.username} />}
                <AvatarFallback className="bg-background/80 text-xl text-primary backdrop-blur">
                  {getInitials(profile?.fullName ?? me.username)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {profile?.fullName ?? me.username}
              </h2>
              <p className="text-sm text-muted-foreground">@{me.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`${glassChip} text-primary`}>
                  <ShieldCheckIcon className="size-3.5" />
                  {me.role.name}
                </span>
                {me.isActive ? (
                  <span className={`${glassChip} text-success`}>
                    <span className="size-1.5 rounded-full bg-success" />
                    Active
                  </span>
                ) : (
                  <span className={`${glassChip} text-destructive`}>
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <AccountProfileDialog me={me} />
        </div>

        <div className="border-t border-white/40 dark:border-white/10" />

        <dl className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/40 bg-white/40 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/3"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${glass} p-6`}>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary backdrop-blur">
              <KeyRoundIcon className="size-4" />
            </span>
            <h3 className="text-base font-semibold">Security</h3>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/40 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/3">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">
                Change your account password regularly.
              </p>
            </div>
            <AccountPasswordDialog />
          </div>
        </section>

        <section className={`${glass} p-6`}>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-info/10 text-info backdrop-blur">
              <ShieldCheckIcon className="size-4" />
            </span>
            <h3 className="text-base font-semibold">Permissions</h3>
          </div>
          <div className="mt-4">
            {me.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {me.permissions.map((permission) => (
                  <span key={permission.id} className={`${glassChip} text-muted-foreground`}>
                    {permission.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No permissions assigned.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
