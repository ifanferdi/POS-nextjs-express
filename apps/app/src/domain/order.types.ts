import { MidtransPaymentDetail, Payment } from '@/domain/payment.types';
import { ProductDiscountCycle } from '@/domain/product-discount-cycle.types';
import { Product } from '@/domain/product.types';
import { UserProfile } from '@/domain/user.types';
import { ApiResponse } from './general.types';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);

export enum OrderRelation {
  CUSTOMER = 'customer',
  CUSTOMER_PROFILE = 'customer.profile',
  USER = 'user',
  USER_PROFILE = 'user.profile',
  ORDER_ITEMS = 'order-items',
  ORDER_ITEMS_PRODUCT = 'order-items.product',
  PAYMENT = 'payment',
}

interface Snapshot {
  /** Waktu data diambil saat order dibuat. */
  snapshotAt?: Date;
}

export interface OrderItemMeta {
  product?: Product & Snapshot;
  discount?: ProductDiscountCycle & Snapshot;
  /** Total potongan item (sudah clamp dan partial) dalam Rp. */
  discountAmount?: number;
  /** Jumlah unit yang kena diskon; bisa kurang dari quantity. */
  discountQty?: number;
}

export interface OrderMeta {
  user?: UserProfile & Snapshot;
  products?: Array<Product & Snapshot>;
  discounts?: Array<ProductDiscountCycle & Snapshot>;
}

export interface Order {
  id: number;
  customerId: number | null;
  userId: number | null;
  orderNumber: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  meta: OrderMeta | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDetail extends Order {
  payment: Payment;
  user: UserProfile;
  customer: UserProfile;
  orderItems: OrderItemProducts[];
}

export interface OrderList extends Order {
  payment: Payment;
  _count: { orderItems: number };
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  meta: OrderItemMeta | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemProducts extends OrderItem {
  product: Product;
}
export interface CreatedOrder extends Order {
  payment: Payment & { midtransDetail: MidtransPaymentDetail };
}

export interface PosLastOrder extends CreatedOrder {
  orderItems: Array<OrderItem & { product: Product }>;
  user: UserProfile;
}

export interface OrderApiResponse extends ApiResponse {
  order: CreatedOrder & {
    orderItems: Array<OrderItem & { product: Product }>;
    user: UserProfile;
  };
}

export type OrderStatusResponse = Order;
