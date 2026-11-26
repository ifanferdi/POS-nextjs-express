import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdProductDiscountCycleDto } from '@/validations/product-discount-cycle-validation';

export default class FindByIdProductDiscountCycle extends BaseUseCase {
  async execute(params: FindByIdProductDiscountCycleDto) {
    const discount = await this.repositories.productDiscountCycleRepository.findOne(params);
    if (!discount) throw new ErrorNotFound('Diskon tidak ditemukan');

    return discount;
  }
}
