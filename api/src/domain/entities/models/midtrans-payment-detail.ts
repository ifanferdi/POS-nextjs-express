import { PaymentStatus } from '../enums/payment.enum';

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
