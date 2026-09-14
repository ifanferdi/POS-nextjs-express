import { Order } from './order.types';

export enum PaymentRelation {
  ORDER = 'order',
  MIDTRANS_DETAIL = 'midtrans-detail',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  QRIS = 'qris',
  VA_BCA = 'va_bca',
  VA_BNI = 'va_bni',
  VA_BRI = 'va_bri',
  VA_MANDIRI = 'va_mandiri',
}
export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);

export interface Payment {
  id: number;
  orderId: number;
  subtotal: number;
  rounding: number;
  total: number;
  amount: number;
  change: number;
  method: PaymentMethod;
  reference: string | null;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  order?: Order;
  midtransDetail?: MidtransPaymentDetail;
}

export interface MidtransPaymentDetail {
  id: number;
  paymentId: number;
  midtransOrderId: string;
  transactionId?: string | null;
  paymentType?: string | null;
  transactionStatus?: string | null;
  fraudStatus?: string | null;
  vaNumber?: string | null;
  qrCodeUrl?: string | null;
  expiryTime?: Date | string | null;
  signatureVerified?: boolean;
  processedAt?: Date | string | null;
  rawNotification?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
