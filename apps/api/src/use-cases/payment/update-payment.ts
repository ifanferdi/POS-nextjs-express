import { UpdatePaymentDto } from '@/validations/payment-validation';
import BaseUseCase from '../_base-use-case';

export default class UpdatePayment extends BaseUseCase {
  async execute(params: UpdatePaymentDto) {
    return this.repositories.paymentRepository.update(params);
  }
}
