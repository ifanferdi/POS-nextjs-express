import CreatePayment from '@/use-cases/payment/create-payment';
import FindAllPayment from '@/use-cases/payment/find-all-payment';
import FindByIdPayment from '@/use-cases/payment/find-by-id-payment';

export interface PaymentUseCase {
  findAllPayment: FindAllPayment;
  findByIdPayment: FindByIdPayment;
  createPayment: CreatePayment;
}
