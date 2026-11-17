import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { ErrorBadRequest, ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UpdateOrderStatusDto } from '@/validations/order-validation';

export default class UpdateOrderStatus extends BaseUseCase {
  async execute(payload: UpdateOrderStatusDto) {
    const order = await this.repositories.orderRepository.findOne({ id: payload.id });
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');
    if (payload.status === OrderStatus.CANCELLED)
      throw new ErrorBadRequest('Gunakan endpoint pembatalan untuk membatalkan pesanan.');
    if (order.status === OrderStatus.CANCELLED)
      throw new ErrorBadRequest('Status pesanan yang dibatalkan tidak dapat diubah.');

    return this.repositories.orderRepository.update(payload);
  }
}
