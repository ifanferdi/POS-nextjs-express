import {
  Order,
  OrderItem,
  Payment,
} from '../../../infrastructure/database/prisma/generated/client';
import { OrderScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { PaymentMethod } from '../enums/payment.enum';
import { IUser } from './user';

export interface IOrder extends Order {
  id: number;
  customer?: IUser;
  user?: IUser;
  orderItems?: IOrderItem[];
  payment?: IPayment;
}

export interface IOrderItem extends OrderItem {
  id: number;
}

export interface IPayment extends Payment {
  id: number;
}

export interface StoreOrderDto {
  customerId?: number;
  userId?: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  meta?: Record<string, any>;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    meta?: Record<string, any>;
  }[];
  payment: {
    rounding?: number;
    total: number;
    amount: number;
    change?: number;
    reference?: string;
  };
}

export const ORDER_FIELD = OrderScalarFieldEnum;
export type ORDER_FIELD = (typeof ORDER_FIELD)[keyof typeof ORDER_FIELD];
export const ORDER_FIELDS = Object.keys(ORDER_FIELD) as ORDER_FIELD[];
