import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { ErrorConflict, ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreatePaymentDto } from '@/validations/payment-validation';

export default class CreatePayment extends BaseUseCase {
  async execute(payload: CreatePaymentDto) {
    const order = await this.repositories.orderRepository.findOne({ id: payload.orderId });
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');

    // ponytail: 1-to-1 relation, guard before insert to surface a clean conflict
    // error instead of a Prisma unique-constraint violation
    const existing = await this.repositories.paymentRepository.findOne({
      orderId: payload.orderId,
      columns: ['id'],
    });
    if (existing) throw new ErrorConflict('Pesanan sudah memiliki pembayaran');

    const payment = await this.repositories.paymentRepository.store({
      ...payload,
      subtotal: order.subtotal,
      rounding: order.total - order.subtotal,
      total: order.total,
      change: payload.amount - order.total,
    });

    if (payload.method === order.paymentMethod) {
      await this.repositories.orderRepository.update({
        id: payload.orderId,
        status: OrderStatus.COMPLETED,
      });
    }

    return payment;
  }
}
