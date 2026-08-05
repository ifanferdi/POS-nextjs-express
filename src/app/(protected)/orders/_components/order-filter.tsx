'use client';

import { DefaultFilter, Filter } from '@/components/shared/filter';
import { ORDER_STATUS_VALUES, PAYMENT_METHOD_VALUES } from '@/domain';
import { ClipboardListIcon, CreditCardIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function OrderFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = searchParams.get('status');
  const currentPaymentMethod = searchParams.get('paymentMethod');
  const hasActiveFilter = Boolean(currentStatus || currentPaymentMethod);

  function pushParams(params: URLSearchParams) {
    params.set('page', '1');
    startTransition(() => router.push(`/orders?${params.toString()}`));
  }

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    pushParams(params);
  }

  function resetFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    params.delete('paymentMethod');
    pushParams(params);
  }

  return (
    <Filter hasActiveFilter={hasActiveFilter} resetFilter={resetFilter}>
      <DefaultFilter
        activeFilter={currentStatus}
        labelComponent={
          <>
            <ClipboardListIcon />
            <span>Status</span>
          </>
        }
        onChangeFunction={(v) => updateParam('status', v === 'all' ? null : v)}
        placeholderItem={null}
        items={ORDER_STATUS_VALUES.map((order) => ({ key: order, label: order }))}
      />
      <DefaultFilter
        activeFilter={currentPaymentMethod}
        labelComponent={
          <>
            <CreditCardIcon />
            <span>Payment</span>
          </>
        }
        onChangeFunction={(v) => updateParam('paymentMethod', v === 'all' ? null : v)}
        placeholderItem={null}
        items={PAYMENT_METHOD_VALUES.map((payment) => ({ key: payment, label: payment }))}
      />
    </Filter>
  );
}
