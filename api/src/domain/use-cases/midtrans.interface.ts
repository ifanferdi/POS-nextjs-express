import SyncMidtransToDatabase from '@/use-cases/midtrans/sync-midtrans-to-database';

export interface MidtransUseCase {
  syncMidtransToDatabase: SyncMidtransToDatabase;
}
