import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllProductDiscountCycleDto } from '@/validations/product-discount-cycle-validation';

export default class FindAllProductDiscountCycle extends BaseUseCase {
  async execute(params: FindAllProductDiscountCycleDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.productDiscountCycleRepository.findAll(params);
    const total = await this.repositories.productDiscountCycleRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}
