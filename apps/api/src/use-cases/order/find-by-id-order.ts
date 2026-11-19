import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdOrderDto } from '@/validations/order-validation';
import BaseUseCase from '@/use-cases/_base-use-case';
import handleOrderImageUrls, { OrderWithImageRelations } from './handle-order-image-urls';

export default class FindByIdOrder extends BaseUseCase {
  async execute(params: FindByIdOrderDto) {
    const order =
      await this.repositories.orderRepository.findOne<OrderWithImageRelations>(params);
    if (!order) throw new ErrorNotFound('Pesanan tidak ditemukan');

    await handleOrderImageUrls(this.repositories.storageRepository, order);

    return order;
  }
}
