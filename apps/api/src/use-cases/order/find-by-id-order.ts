import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdOrderDto } from '@/validations/order-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindByIdOrder extends BaseUseCase {
  async execute(params: FindByIdOrderDto) {
    const order = await this.repositories.orderRepository.findOne(params);
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');

    return order;
  }
}
