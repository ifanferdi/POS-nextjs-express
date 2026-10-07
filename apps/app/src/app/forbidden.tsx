import { StatusPage } from '@/components/shared/status-page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Forbidden() {
  return (
    <StatusPage
      code={403}
      title="Access denied"
      description="You don't have permission to access this resource. Contact your administrator if you think this is a mistake."
      action={
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      }
    />
  );
}
