import { Product } from '@/domain/product.types';
import { User } from '@/domain/user.types';
import { ApiResponse } from './general.types';
import { Payment, PaymentMethod } from './payment.types';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);

export enum OrderRelation {
  ORDER_ITEMS = 'order-items',
  CUSTOMER = 'customer',
  USER = 'user',
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
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
  customer?: User;
  user?: User;
  payment?: Payment;
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
  product?: Product;
}

export interface OrderApiResponse extends ApiResponse {
  order: {
    order: Order;
    paymentType?: string;
    vaNumber?: number;
    qrCodeUrl?: string;
    expiryTime?: string;
  };
}

export type OrderStatusResponse = Order;
