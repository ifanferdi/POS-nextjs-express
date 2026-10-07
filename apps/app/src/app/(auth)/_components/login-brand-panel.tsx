import { app as config } from '@/config/config';
import { Banknote, CreditCard, QrCode, Store } from 'lucide-react';

const salesBars = [38, 52, 44, 66, 58, 74, 62, 80, 70, 88, 78, 100];

const recentOrders = [
  { id: '#1047', cashier: 'Dina', total: '$24.50', paid: true },
  { id: '#1046', cashier: 'Raka', total: '$12.00', paid: false },
  { id: '#1045', cashier: 'Dina', total: '$36.20', paid: true },
];

const paymentMethods = [
  { icon: Banknote, label: 'Cash' },
  { icon: QrCode, label: 'QRIS' },
  { icon: CreditCard, label: 'Card' },
];

export function LoginBrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden p-10 text-primary-foreground xl:p-14">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(160deg,oklch(0.55_0.14_175),oklch(0.62_0.15_140)_55%,oklch(0.68_0.16_90))]"
      />
      <div className="absolute -top-32 -right-24 size-96 rounded-full bg-[oklch(0.62_0.15_140)/30] blur-3xl" />
      <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-[oklch(0.68_0.16_90)/25] blur-3xl" />

      <div className="relative mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between rounded-t-2xl border border-white/15 border-b-transparent bg-white/10 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
              <Store className="size-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Register 01</p>
              <p className="text-xs text-primary-foreground/60">Main Branch · Shift A</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            <span className="size-1.5 animate-pulse rounded-full bg-success-foreground" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/60">
              Today&apos;s sales
            </p>
            <p className="text-2xl font-bold tabular-nums">$2,845</p>
            <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
              ↑ 12.4% vs yesterday
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/60">
              Transactions
            </p>
            <p className="text-2xl font-bold tabular-nums">148</p>
            <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
              ↑ 8.2% vs yesterday
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex h-24 items-end gap-1.5">
            {salesBars.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={
                  i === salesBars.length - 1
                    ? 'flex-1 rounded-sm bg-white'
                    : 'flex-1 rounded-sm bg-white/25'
                }
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-primary-foreground/60">
            <span>09:00</span>
            <span>Hourly sales</span>
            <span>21:00</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <p className="mb-3 text-xs uppercase tracking-wide text-primary-foreground/60">
            Recent orders
          </p>
          <ul className="space-y-2.5">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between text-sm">
                <span className="font-medium tabular-nums">{order.id}</span>
                <span className="text-primary-foreground/60">{order.cashier}</span>
                <span className="tabular-nums">{order.total}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  <span
                    className={
                      order.paid
                        ? 'size-1.5 rounded-full bg-success-foreground'
                        : 'size-1.5 rounded-full border border-current opacity-50'
                    }
                  />
                  {order.paid ? 'Paid' : 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {paymentMethods.map((method) => (
            <div
              key={method.label}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 py-2.5 text-sm backdrop-blur-md"
            >
              <method.icon className="size-4" />
              {method.label}
            </div>
          ))}
        </div>

        <p className="pt-2 text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {config.name} — every sale, one dashboard.
        </p>
      </div>
    </div>
  );
}
