import { Product } from '@/domain/product.types';
import { User } from '@/domain/user.types';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
export const ORDER_STATUS_VALUES = Object.values(OrderStatus);

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}
export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethod);

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

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
  orderItems: OrderItem[];
  customer: User;
  user: User;
  payment: Payment;
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
}
