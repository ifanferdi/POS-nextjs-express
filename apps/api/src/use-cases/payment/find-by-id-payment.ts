import { ErrorNotFound } from '@/helpers/error.helper';
import { Payment } from '@/infrastructure/database/prisma/generated/client';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdPaymentDto } from '@/validations/payment-validation';

export default class FindByIdPayment extends BaseUseCase {
  async execute<T = Payment>(params: FindByIdPaymentDto) {
    const payment = await this.repositories.paymentRepository.findOne(params);
    if (!payment) throw new ErrorNotFound('Pembayaran tidak ditemukan');

    return payment as T;
  }
}
