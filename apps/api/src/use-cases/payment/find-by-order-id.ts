import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdPaymentDto } from '@/validations/payment-validation';

export default class FindByOrderId extends BaseUseCase {
  async execute({ id: orderId, ...params }: FindByIdPaymentDto) {
    const payment = await this.repositories.paymentRepository.findOne({ orderId, ...params });
    if (!payment) throw new ErrorNotFound('Pembayaran tidak ditemukan');

    return payment;
  }
}
