export enum OrderRelation {
  CUSTOMER = 'customer',
  USER = 'user',
  USER_PROFILE = 'user.profile',
  ORDER_ITEMS = 'order-items',
  ORDER_ITEMS_PRODUCT = 'order-items.product',
  PAYMENT = 'payment',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
