export enum PaymentRelation {
  ORDER = 'order',
}

export enum PaymentMethod {
  CASH = 'cash',
  QRIS = 'qris',
  VA_BCA = 'va_bca',
  VA_BNI = 'va_bni',
  VA_BRI = 'va_bri',
  VA_MANDIRI = 'va_mandiri',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
