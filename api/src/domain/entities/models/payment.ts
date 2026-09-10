import { Payment, Prisma } from '@/infrastructure/database/prisma/generated/client';
import { PaymentScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { IMidtransPaymentDetail } from './midtrans-payment-detail';
import { IOrder } from './order';

export interface IPayment extends Payment {
  order?: IOrder;
  midtransPaymentDetail?: IMidtransPaymentDetail;
}

export const PAYMENT_FIELD = PaymentScalarFieldEnum;
export type PAYMENT_FIELD = (typeof PAYMENT_FIELD)[keyof typeof PAYMENT_FIELD];
export const PAYMENT_FIELDS = Object.keys(PAYMENT_FIELD) as PAYMENT_FIELD[];

export const PAYMENT_SELECT_FIELDS = Object.fromEntries(PAYMENT_FIELDS.map((col) => [col, true]));

export type PaymentSelectResult<TCols extends readonly PAYMENT_FIELD[] | undefined> =
  TCols extends readonly PAYMENT_FIELD[]
    ? Prisma.PaymentGetPayload<{ select: { [K in TCols[number]]: true } }>
    : Payment;
