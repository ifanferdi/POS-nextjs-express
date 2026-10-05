'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { app as config } from '@/config/config';
import { loginAction } from '@/features/auth/action';
import { LoginInput, LoginSchema } from '@/features/auth/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, Store, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function LoginForm({ sessionExpired }: { sessionExpired?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  function onSubmit(input: LoginInput) {
    startTransition(async function () {
      const result = await loginAction(input);
      if (!result.success) {
        toast.error('Login failed', { description: result.error });
        return;
      }

      toast.success('Login successful');
      router.push('/users');
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Store className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            Sign in to your {config.name} dashboard to manage sales, inventory & team.
          </p>
        </div>
      </div>

      {sessionExpired && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>Your session expired. Please sign in again.</p>
        </div>
      )}

      <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="username"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    id="username"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your username"
                    autoComplete="off"
                    className="h-11 pl-9"
                    disabled={isPending}
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your password"
                    autoComplete="off"
                    className="h-11 pr-10"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in to dashboard
                <LogIn className="size-4" />
              </>
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Protected area — authorized cashiers only.
      </p>
    </div>
  );
}
