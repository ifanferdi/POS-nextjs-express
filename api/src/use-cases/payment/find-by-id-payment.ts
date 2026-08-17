import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdPaymentDto } from '@/validations/payment-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindByIdPayment extends BaseUseCase {
  async execute(params: FindByIdPaymentDto) {
    const payment = await this.repositories.paymentRepository.findOne(params);
    if (!payment) throw new ErrorNotFound('Pembayaran tidak ditemukan');

    return payment;
  }
}
