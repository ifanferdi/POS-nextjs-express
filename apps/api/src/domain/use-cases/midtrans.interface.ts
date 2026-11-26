import MidtransWebhook from '@/use-cases/midtrans/midtrans-webhook';

export interface MidtransUseCase {
  syncMidtransToDatabase: MidtransWebhook;
}
