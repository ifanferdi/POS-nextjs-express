import { MidtransPaymentDetail } from '@/infrastructure/database/prisma/generated/client';
import { PaymentStatus } from '../enums/payment.enum';
import { IPayment } from './payment';

export interface IMidtransPaymentDetail extends MidtransPaymentDetail {
  payment?: IPayment;
}

export interface MidtransPaymentUpdate {
  id: number;
  status: PaymentStatus;
  paidAt?: Date;
  expiredAt: Date;
  midtransDetail: {
    midtransOrderId: string;
    transactionId: string;
    paymentType: string;
    transactionStatus: string;
    fraudStatus: string;
    signatureVerified: boolean;
    rawNotification: Record<string, any>;
  };
}
