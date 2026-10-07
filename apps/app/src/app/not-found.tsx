import { StatusPage } from '@/components/shared/status-page';
import { Button } from '@/components/ui/button';
import { HomeIcon, LayoutDashboardIcon } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <StatusPage
      code={404}
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved. Check the URL, or head back home."
      action={
        <>
          <Button asChild>
            <Link href="/">
              <HomeIcon />
              Back to home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <LayoutDashboardIcon />
              Go to dashboard
            </Link>
          </Button>
        </>
      }
    />
  );
}
