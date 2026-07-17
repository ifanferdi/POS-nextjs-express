import { OrderStatus } from '../../domain/entities/enums/order.enum';
import { ErrorNotFound } from '../../helpers/error.helper';
import { CreatePaymentDto } from '../../validations/payment-validation';
import BaseUseCase from '../_base-use-case';

export default class CreatePayment extends BaseUseCase {
  async execute(payload: CreatePaymentDto) {
    const order = await this.repositories.orderRepository.findOne({ id: payload.orderId });
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');

    const payment = await this.repositories.paymentRepository.store(payload);

    if (payload.method === order.paymentMethod) {
      await this.repositories.orderRepository.update({ id: payload.orderId, status: OrderStatus.COMPLETED });
    }

    return payment;
  }
}
