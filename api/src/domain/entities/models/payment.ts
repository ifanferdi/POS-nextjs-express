import { MidtransPaymentDetail, Payment } from '@/infrastructure/database/prisma/generated/client';
import { PaymentScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';

export interface PaymentMidtransDetail extends Payment {
  midtransDetail: MidtransPaymentDetail;
}

export const PAYMENT_FIELD = PaymentScalarFieldEnum;
export type PAYMENT_FIELD = (typeof PAYMENT_FIELD)[keyof typeof PAYMENT_FIELD];
export const PAYMENT_FIELDS = Object.keys(PAYMENT_FIELD) as PAYMENT_FIELD[];

export const PAYMENT_SELECT_FIELDS = Object.fromEntries(PAYMENT_FIELDS.map((col) => [col, true]));
