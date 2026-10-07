'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // React 19 / Next 16 menandai <script> inline yang di-render di client component
  // sebagai error ("Encountered a script tag..."). next-themes merender script itu
  // untuk mencegah FOUC. Di client, ubah type-nya jadi data block (application/json)
  // supaya React tidak mengeluh; di server biarkan script biasa agar tetap dieksekusi
  // sebelum paint (tanpa flash). suppressHydrationWarning sudah di-set next-themes.
  const scriptProps =
    typeof window === 'undefined' ? undefined : ({ type: 'application/json' } as const);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
