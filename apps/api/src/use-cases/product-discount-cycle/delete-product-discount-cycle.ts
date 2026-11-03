import { redisRemainingKey } from '@/helpers/discount.helper';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteProductDiscountCycle extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    const existing = await this.repositories.productDiscountCycleRepository.findOne({ id });
    if (!existing) throw new ErrorNotFound('Diskon tidak ditemukan');

    await this.repositories.productDiscountCycleRepository.destroy(id);
    await this.repositories.redisRepository.destroy(redisRemainingKey(id));
  }
}
