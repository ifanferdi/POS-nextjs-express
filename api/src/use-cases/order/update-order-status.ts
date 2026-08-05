import { ErrorNotFound } from '../../helpers/error.helper';
import { UpdateOrderStatusDto } from '../../validations/order-validation';
import BaseUseCase from '../_base-use-case';

export default class UpdateOrderStatus extends BaseUseCase {
  async execute(payload: UpdateOrderStatusDto) {
    const order = await this.repositories.orderRepository.findOne({ id: payload.id });
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');

    return this.repositories.orderRepository.update(payload);
  }
}
