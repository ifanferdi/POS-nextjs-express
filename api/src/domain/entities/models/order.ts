import { IProfile, IUser } from '@/domain/entities/models/user';
import { Order, OrderItem } from '@/infrastructure/database/prisma/generated/client';
import { OrderScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { IMidtransPaymentDetail } from './midtrans-payment-detail';
import { IPayment } from './payment';
import { IProduct } from './product';

export interface IOrder extends Order {
  id: number;
  customer?: IUser;
  user?: IUser;
  orderItems?: IOrderItem[];
  payment?: IPayment;
}

export interface IOrderItem extends OrderItem {
  id: number;
  product: IProduct;
}

export interface MetaProduct extends Partial<IProduct> {
  snapshotAt?: Date;
}

export interface MetaOrder {
  user?: IUser;
  customer?: IUser;
}

export interface MetaOrderItems {
  product?: IProduct;
  order?: IOrder;
}

export interface StoreOrderDtoItems {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  meta?: Record<string, any>;
}

export interface StoreOrderDto {
  customerId?: number;
  userId?: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  meta?: Record<string, any>;
  items: StoreOrderDtoItems[];
  payment: Pick<IPayment, 'amount' | 'change' | 'rounding' | 'total' | 'method' | 'reference'>;
}

export interface StoreOrderResponse extends Omit<
  IOrder,
  'customer' | 'user' | 'orderItems' | 'payment'
> {
  user: IUser & { profile: IProfile };
  orderItems: Array<IOrderItem & { product: IProduct }>;
  payment: Promise<IPayment & { midtransDetail: IMidtransPaymentDetail }>;
}

export const ORDER_FIELD = OrderScalarFieldEnum;
export type ORDER_FIELD = (typeof ORDER_FIELD)[keyof typeof ORDER_FIELD];
export const ORDER_FIELDS = Object.keys(ORDER_FIELD) as ORDER_FIELD[];
