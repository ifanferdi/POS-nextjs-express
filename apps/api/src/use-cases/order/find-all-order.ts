import AppError from '@/helpers/error.helper';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllOrderDto } from '@/validations/order-validation';
import handleOrderImageUrls, { OrderWithImageRelations } from './handle-order-image-urls';

export default class FindAllOrder extends BaseUseCase {
  async execute(params: FindAllOrderDto) {
    const { page = 1, limit = 10 } = params;

    const data =
      await this.repositories.orderRepository.findAll<OrderWithImageRelations>(params);
    const total = await this.repositories.orderRepository.count(params);

    await Promise.all(
      data.map((order) =>
        handleOrderImageUrls(this.repositories.storageRepository, order),
      ),
    );

    return paginate({ page, limit, total, data });
  }
}
