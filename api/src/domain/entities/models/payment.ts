import { Payment } from '../../../infrastructure/database/prisma/generated/client';
import { PaymentScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';

export interface IPayment extends Payment {
  order?: { id: number; orderNumber: string };
}

export const PAYMENT_FIELD = PaymentScalarFieldEnum;
export type PAYMENT_FIELD = (typeof PAYMENT_FIELD)[keyof typeof PAYMENT_FIELD];
export const PAYMENT_FIELDS = Object.keys(PAYMENT_FIELD) as PAYMENT_FIELD[];

export const PAYMENT_SELECT_FIELDS = Object.fromEntries(
  PAYMENT_FIELDS.map((col) => [col, true]),
);
