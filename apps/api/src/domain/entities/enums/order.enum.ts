export enum OrderRelation {
  CUSTOMER = 'customer',
  USER = 'user',
  USER_PROFILE = 'user.profile',
  CUSTOMER_PROFILE = 'customer.profile',
  ORDER_ITEMS = 'order-items',
  ORDER_ITEMS_PRODUCT = 'order-items.product',
  PAYMENT = 'payment',
  PAYMENT_MIDTRANS = 'payment.midtrans',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
