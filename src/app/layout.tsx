import '@/app/globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { Toaster } from 'sonner';

const font = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // CSS variable, dipanggil di Tailwind
});

export const metadata: Metadata = {
  title: 'Next.js Boilerplate',
  description: 'User Role Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${font.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
