import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, getDiscountPercentage } from '@/lib/helper';
import { cn } from '@/lib/utils';

export function PriceTag({
  price,
  finalPrice,
  className,
  finalClassName,
  compareClassName,
}: {
  price: number;
  finalPrice: number;
  className?: string;
  finalClassName?: string;
  compareClassName?: string;
}) {
  const discounted = finalPrice < price;

  return (
    <span className={cn('inline-flex items-baseline gap-1.5 tabular-nums', className)}>
      <span
        suppressHydrationWarning
        className={cn('text-primary font-semibold tabular-nums', finalClassName)}
      >
        {finalPrice === 0 ? 'Free' : formatCurrency(finalPrice)}
      </span>
      {discounted && (
        <span
          suppressHydrationWarning
          className={cn(
            'text-xs text-muted-foreground line-through tabular-nums',
            compareClassName,
          )}
        >
          {formatCurrency(price)}
        </span>
      )}
    </span>
  );
}

export function DiscountBadge({ price, amount }: { price: number; amount: number }) {
  const percent = getDiscountPercentage(price, amount);
  if (percent <= 0) return null;

  return (
    <span
      className="inline-flex items-center rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success tabular-nums"
      aria-label={`${percent}% off`}
    >
      -{percent}%
    </span>
  );
}

export function QuotaBadge({ remainingQuota }: { remainingQuota: number | null }) {
  // Hanya tampil saat kuota menipis agar card tidak penuh badge.
  if (remainingQuota === null || remainingQuota <= 0 || remainingQuota > 10) return null;

  const label = `${remainingQuota} left`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={label}
          className="inline-flex cursor-help items-center rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {label}
        </span>
      </TooltipTrigger>
    </Tooltip>
  );
}
