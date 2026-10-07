import { MidtransPaymentDetail, Payment } from '@/domain/payment.types';
import { Product } from '@/domain/product.types';
import { UserProfile } from '@/domain/user.types';
import { CartItem } from '../store/pos-cart-store';
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

export interface Order {
  id: number;
  customerId: number | null;
  userId: number | null;
  orderNumber: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  meta: Record<string, unknown> | null;
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
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemProducts extends OrderItem {
  product: Product;
}
export interface CreatedOrder extends Order {
  payment: Payment & { midtransDetail: MidtransPaymentDetail };
}

export interface PosLastOrder {
  order: CreatedOrder;
  items: CartItem[];
  amountTendered?: number;
  qrCodeUrl?: string;
  vaNumber?: string;
  paymentType?: string;
  expiryTime?: string;
}

export interface OrderApiResponse extends ApiResponse {
  order: {
    order: CreatedOrder;
    paymentType?: string;
    vaNumber?: number;
    qrCodeUrl?: string;
    expiryTime?: string;
  };
}

export type OrderStatusResponse = Order;
