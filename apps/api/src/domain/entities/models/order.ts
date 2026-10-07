import { IProfile, IUser, IUserProfile } from '@/domain/entities/models/user';
import {
  Order,
  OrderItem,
  Payment,
  Product,
} from '@/infrastructure/database/prisma/generated/client';
import { OrderScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { PaymentMidtransDetail } from './payment';

export interface OrderPayment extends Order {
  payment: Payment;
}
export interface OrderItemProduct extends OrderItem {
  product: Product;
}

export interface MetaProduct extends Partial<Product> {
  snapshotAt?: Date;
}

export interface MetaOrder {
  user?: IUserProfile | IUser;
  customer?: IUserProfile | IUser;
}

export interface MetaOrderItems {
  product?: Product;
  order?: Order;
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
  payment: Pick<Payment, 'amount' | 'change' | 'rounding' | 'total' | 'method'>;
}

export interface StoreOrderResponse extends Omit<
  Order,
  'customer' | 'user' | 'orderItems' | 'payment'
> {
  user: IUser & { profile: IProfile };
  orderItems: Array<OrderItemProduct>;
  payment: PaymentMidtransDetail;
}

export const ORDER_FIELD = OrderScalarFieldEnum;
export type ORDER_FIELD = (typeof ORDER_FIELD)[keyof typeof ORDER_FIELD];
export const ORDER_FIELDS = Object.keys(ORDER_FIELD) as ORDER_FIELD[];
