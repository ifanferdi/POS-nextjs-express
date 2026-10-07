'use client';

import { useEffect } from 'react';

/**
 * Menangkap error di root layout (di luar jangkauan `error.tsx`).
 * Root layout digantikan, jadi ThemeProvider/globals.css tidak tersedia —
 * semua styling di-inline dan tema mengikuti prefers-color-scheme.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --ge-bg: #fafafa;
            --ge-fg: #171717;
            --ge-muted: #6b7280;
            --ge-surface: #ffffff;
            --ge-border: #e5e7eb;
            --ge-primary: #3b5bdb;
            --ge-primary-fg: #ffffff;
            --ge-danger: #dc2626;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #141822;
              --ge-fg: #f5f5f5;
              --ge-muted: #9ca3af;
              --ge-surface: #1c212e;
              --ge-border: rgba(255, 255, 255, 0.12);
              --ge-primary: #6f8cff;
              --ge-primary-fg: #10131a;
              --ge-danger: #f87171;
            }
          }
          .ge-btn:focus-visible { outline: 2px solid var(--ge-primary); outline-offset: 2px; }
        `}</style>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: 'var(--ge-bg)',
          color: 'var(--ge-fg)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                border: '1px solid var(--ge-border)',
                background: 'var(--ge-surface)',
                color: 'var(--ge-danger)',
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <span
              style={{
                position: 'absolute',
                right: -8,
                bottom: -8,
                padding: '2px 6px',
                borderRadius: 8,
                border: '1px solid var(--ge-border)',
                background: 'var(--ge-bg)',
                color: 'var(--ge-muted)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              500
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Something went wrong
            </h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ge-muted)' }}>
              A critical error occurred and the app couldn&apos;t render. Please try again.
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="ge-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: '0 18px',
              border: 'none',
              borderRadius: 10,
              background: 'var(--ge-primary)',
              color: 'var(--ge-primary-fg)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
