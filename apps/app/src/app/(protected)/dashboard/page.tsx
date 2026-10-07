import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { icons } from '@/config/config';
import { LucideIcon } from 'lucide-react';

const stats: { title: string; value: string; icon: LucideIcon; trend?: string }[] = [
  { title: 'Total Users', value: '128', icon: icons.user, trend: '+12%' },
  { title: 'Categories', value: '24', icon: icons.category },
  { title: 'Products', value: '342', icon: icons.product, trend: '+5%' },
  { title: 'Orders', value: '89', icon: icons.order, trend: '-3%' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome to your admin panel</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && (
                <p className={`text-xs ${stat.trend.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                  {stat.trend} from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
