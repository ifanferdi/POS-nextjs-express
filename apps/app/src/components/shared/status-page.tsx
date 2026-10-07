import { cn } from '@/lib/utils';
import React from 'react';

interface StatusPageProps {
  code: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Full-page status surface for error / not-found states.
 * `role="alert"` so screen readers announce it on navigation.
 * Dark hero so the oversized white code stays legible in both themes.
 */
export function StatusPage({ code, title, description, action, className }: StatusPageProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary)/30,transparent_70%)]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300">
        <p className="text-7xl font-bold tabular-nums tracking-tight text-theme sm:text-8xl">
          {code}
        </p>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-theme sm:text-3xl">{title}</h1>
          <p className="text-pretty text-sm leading-relaxed text-theme/70">{description}</p>
        </div>

        {action && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">{action}</div>
        )}
      </div>
    </div>
  );
}
