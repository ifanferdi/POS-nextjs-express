import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { app } from '@/config/config';
import { Metadata } from 'next';
import localFont from 'next/font/local';
import React from 'react';
import { Toaster } from 'sonner';

const font = localFont({
  src: './fonts/ibm-plex-sans-latin.woff2',
  display: 'swap',
  weight: '400 700',
  variable: '--font-ibm-plex',
});

export const metadata: Metadata = {
  title: app.name,
  description: app.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable} suppressHydrationWarning>
      <body className={`${font.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        {/* Satu Toaster global — sebelumnya hanya di (protected)/(pos), sehingga
            toast login di halaman (auth) tidak pernah muncul di produksi. */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
