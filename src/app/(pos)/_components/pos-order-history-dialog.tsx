'use client';

import { PosPaymentModule } from '@/app/(pos)/_components/pos-payment-module';
import { OrderTable } from '@/app/(protected)/orders/_components/order-data-table';
import { OrderDetailCard } from '@/app/(protected)/orders/_components/order-detail-card';
import { OrderTableSkeleton } from '@/app/(protected)/orders/_components/order-table-skeleton';
import { DefaultFilter, Filter } from '@/components/shared/filter';
import { Skeleton } from '@/components/shared/table-server';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import {
  ORDER_STATUS_VALUES,
  OrderDetail,
  OrderList,
  OrderRelation,
  OrderStatus,
  PAYMENT_METHOD_VALUES,
  PaymentRelation,
} from '@/domain';
import { getPaymentMethod, PaymentMethod, PaymentMidtrans } from '@/domain/payment.types';
import { getOrderByIdAction, getOrdersAction } from '@/features/orders/action';
import { getPaymentByOrderId } from '@/features/payments/action';
import _ from 'lodash';
import {
  ArrowLeftIcon,
  ClipboardListIcon,
  CreditCardIcon,
  Loader2Icon,
  SearchIcon,
  X,
} from 'lucide-react';
import moment from 'moment';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;
const DEFAULT_STATUS = OrderStatus.PENDING;

interface PosOrderHistoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// TODO: CLEAN CODE ALL LOGIC

export function PosOrderHistoryDialog({ open, setOpen }: PosOrderHistoryDialogProps) {
  const [mode, setMode] = useState<'table' | 'detail'>('table');
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OrderStatus | null>(DEFAULT_STATUS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [payOrder, setPayOrder] = useState<OrderList | null>(null);
  const [payment, setPayment] = useState<PaymentMidtrans | null>(null);
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchIdRef = useRef(0);

  // Nested PaymentDialog close also fires this with next=false (Radix dismiss
  // bubbles). Ignore while the payment overlay is open so history stays put.
  function handleOpenChange(next: boolean) {
    if (!next && payOpen) return;

    setOpen(next);
    if (next) return;

    clearTimeout(debounceRef.current);
    fetchIdRef.current += 1;
    setMode('table');
    setOrders([]);
    setTotal(0);
    setPage(1);
    setIsLoading(false);
    setIsLoadingMore(false);
    setSearch('');
    setQuery('');
    setStatus(DEFAULT_STATUS);
    setPaymentMethod(null);
    setDetail(null);
    setIsDetailLoading(false);
    setPayOrder(null);
    setPayment(null);
    setIsPayLoading(false);
    setPayOpen(false);
  }

  // Debounce search input (500ms), same feel as OrderSearch on /orders.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(search), 500);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Fetch page 1 whenever the dialog opens or filters change.
  useEffect(() => {
    if (!open) return;
    const id = ++fetchIdRef.current;
    const fetchOrders = async () => {
      setIsLoading(true);
      const result = await getOrdersAction<OrderList>({
        page: 1,
        limit: PAGE_SIZE,
        q: query || undefined,
        status: status ?? undefined,
        paymentMethod: paymentMethod ?? undefined,
        with: [OrderRelation.PAYMENT],
      });
      if (id !== fetchIdRef.current) return;

      if (!result) {
        toast.error('Failed to load orders.');
        setOrders([]);
        setTotal(0);
      } else {
        setOrders(result.data);
        setTotal(result.total);
        setPage(1);
      }
      setIsLoading(false);
    };

    void fetchOrders();
  }, [open, query, status, paymentMethod]);

  async function fetchOrders(nextPage: number, append = false) {
    const id = ++fetchIdRef.current;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    const result = await getOrdersAction<OrderList>({
      page: nextPage,
      limit: PAGE_SIZE,
      q: query || undefined,
      status: status ?? undefined,
      paymentMethod: paymentMethod ?? undefined,
      with: [OrderRelation.PAYMENT],
    });
    if (id !== fetchIdRef.current) return;

    if (!result) {
      toast.error('Failed to load orders.');
      if (!append) {
        setOrders([]);
        setTotal(0);
      }
    } else {
      setOrders((prev) => (append ? [...prev, ...result.data] : result.data));
      setTotal(result.total);
      setPage(nextPage);
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  }

  async function loadMore() {
    await fetchOrders(page + 1, true);
  }

  async function handleView(order: OrderList) {
    setDetail(null);
    setMode('detail');
    setIsDetailLoading(true);
    const result = await getOrderByIdAction<OrderDetail>(order.id, [
      OrderRelation.ORDER_ITEMS_PRODUCT,
      OrderRelation.USER_PROFILE,
      OrderRelation.PAYMENT,
      OrderRelation.CUSTOMER_PROFILE,
    ]);
    setIsDetailLoading(false);

    if (!result) {
      toast.error('Failed to load order.');
      setMode('table');
      return;
    }
    setDetail(result);
  }

  async function handlePay(order: OrderList) {
    setPayOrder(order);
    setPayment(null);
    setIsPayLoading(true);

    const result = await getPaymentByOrderId<PaymentMidtrans>({
      orderId: order.id,
      with: [PaymentRelation.MIDTRANS_DETAIL],
    });

    setIsPayLoading(false);

    if (!result || !result.midtransDetail) {
      toast.error('No payment terminal available for this order.');
      return;
    }

    if (moment(result.expiredAt).isSameOrBefore(new Date())) {
      toast.error('Payment expired!');
      return;
    }

    setPayOpen(true);
    setPayment(result);
  }

  async function handlePaid() {
    toast.success('Payment received!');
    setPayOpen(false);
    await fetchOrders(1);
  }

  async function handlePayExpired() {
    toast.error('Payment expired!');
    if (payOpen) setPayOpen(false);
    await fetchOrders(1);
  }

  function handleBack() {
    setMode('table');
    setDetail(null);
    setPayment(null);
    setPayOrder(null);
  }

  const hasActiveFilter = status !== null || paymentMethod !== null;
  const hasMore = !isLoading && orders.length > 0 && orders.length < total;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[90%] flex-col overflow-hidden sm:max-w-[90%]">
        {payOrder && payment && (
          <PaymentDialog
            open={payOpen}
            setOpen={setPayOpen}
            payOrder={payOrder}
            payment={payment}
            handlePaid={handlePaid}
            handlePayExpired={handlePayExpired}
          />
        )}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode !== 'table' && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Back to order list"
                title="Back"
                onClick={handleBack}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeftIcon />
              </Button>
            )}
            {mode === 'detail' ? 'Order Detail' : 'Order History'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'detail'
              ? 'Order details. Use the back button to return to the order list.'
              : 'List of orders. Search or filter, then view an order for details.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'table' ? (
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
              <InputGroup className="w-full sm:w-64">
                <InputGroupInput
                  placeholder="Search order number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      clearTimeout(debounceRef.current);
                      setQuery(search);
                    }
                  }}
                  className="pr-7"
                />
                {search !== '' ? (
                  <X
                    className="absolute right-2.5 size-4 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSearch('');
                      setQuery('');
                    }}
                    aria-label="Clear search"
                  />
                ) : (
                  <SearchIcon className="absolute right-2.5 size-4 text-muted-foreground" />
                )}
              </InputGroup>

              <PosOrderFilter
                hasActiveFilter={hasActiveFilter}
                setStatus={setStatus}
                setPaymentMethod={setPaymentMethod}
                status={status}
                paymentMethod={paymentMethod}
              />
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <OrderTableSkeleton rows={PAGE_SIZE} />
              ) : (
                <OrderTable
                  orders={orders}
                  onView={handleView}
                  onPay={handlePay}
                  isPayLoading={isPayLoading}
                />
              )}
            </div>

            {hasMore && !isLoading && (
              <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2Icon className="animate-spin" />}
                {isLoadingMore ? 'Loading...' : `Load more (${total - orders.length} remaining)`}
              </Button>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {isDetailLoading ? (
              <PosOrderDetailSkeleton />
            ) : (
              detail && <OrderDetailCard order={detail} headerActions={null} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  setOpen,
  payOrder,
  handlePayExpired,
  payment,
  handlePaid,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  payOrder: OrderList;
  payment: PaymentMidtrans;
  handlePayExpired: () => void;
  handlePaid: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-2 font-mono md:min-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Payment</DialogTitle>
        </DialogHeader>
        {
          <PosPaymentModule
            orderId={payOrder.id}
            orderNumber={payOrder.orderNumber}
            paymentMethod={payOrder.payment?.method ?? PaymentMethod.CASH}
            payment={payment}
            onPaid={handlePaid}
            onExpired={handlePayExpired}
          />
        }
      </DialogContent>
    </Dialog>
  );
}

function PosOrderFilter({
  hasActiveFilter,
  setStatus,
  setPaymentMethod,
  status,
  paymentMethod,
}: {
  hasActiveFilter: boolean;
  setStatus: Dispatch<SetStateAction<OrderStatus | null>>;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod | null>>;
  status: OrderStatus | null;
  paymentMethod: PaymentMethod | null;
}) {
  return (
    <Filter
      hasActiveFilter={hasActiveFilter}
      filterSubLabel="Filter by"
      resetFilter={() => {
        setStatus(null);
        setPaymentMethod(null);
      }}
    >
      <DefaultFilter
        activeFilter={status}
        labelComponent={
          <>
            <ClipboardListIcon />
            <span>Status</span>
          </>
        }
        onChangeFunction={(v) => setStatus(v === 'all' ? null : (v as OrderStatus))}
        placeholderItem="All"
        items={ORDER_STATUS_VALUES.map((s) => ({ key: s, label: _.capitalize(s) }))}
      />
      <DefaultFilter
        activeFilter={paymentMethod}
        labelComponent={
          <>
            <CreditCardIcon />
            <span>Payment</span>
          </>
        }
        onChangeFunction={(v) => setPaymentMethod(v === 'all' ? null : (v as PaymentMethod))}
        placeholderItem="All"
        items={PAYMENT_METHOD_VALUES.map((key) => ({
          key,
          label: getPaymentMethod(key),
        }))}
      />
    </Filter>
  );
}

function PosOrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header: title + badges */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-19 w-full" />
        ))}
      </div>
      {/* Customer & payment sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
      {/* Items table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-px w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
