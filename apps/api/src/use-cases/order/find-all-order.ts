import AppError from '@/helpers/error.helper';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllOrderDto } from '@/validations/order-validation';

export default class FindAllOrder extends BaseUseCase {
  async execute(params: FindAllOrderDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.orderRepository.findAll(params);
    const total = await this.repositories.orderRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}
