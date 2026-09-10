import FindAllPayment from '@/use-cases/payment/find-all-payment';
import FindByIdPayment from '@/use-cases/payment/find-by-id-payment';
import FindByOrderId from '@/use-cases/payment/find-by-order-id';

export interface PaymentUseCase {
  findAllPayment: FindAllPayment;
  findByIdPayment: FindByIdPayment;
  findByOrderId: FindByOrderId;
}
