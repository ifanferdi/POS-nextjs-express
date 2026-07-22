import { ShieldCheck, Sparkles, Users, Lock } from 'lucide-react';

export function LoginBrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-foreground p-10 text-primary-foreground">
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
          <ShieldCheck className="size-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">User Management</span>
      </div>

      <div className="relative space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Manage users, roles &
            <br />
            permissions with ease
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            A production-ready Next.js boilerplate with JWT auth, proactive refresh tokens, and
            role-based access control.
          </p>
        </div>

        <ul className="space-y-3.5">
          {[
            { icon: Lock, text: 'Secure JWT authentication' },
            { icon: Users, text: 'Full RBAC management' },
            { icon: Sparkles, text: 'Server Component first architecture' },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="size-4" />
              </div>
              <span className="text-primary-foreground/85">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-primary-foreground/50">
        &copy; {new Date().getFullYear()} Boilerplate Next.js. Built for scale.
      </p>
    </div>
  );
}
