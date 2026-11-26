import { discountTtlSeconds, redisRemainingKey, remainingQuota } from '@/helpers/discount.helper';
import { ErrorBadRequest, ErrorConflict, ErrorNotFound } from '@/helpers/error.helper';
import { ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateProductDiscountCycleDto } from '@/validations/product-discount-cycle-validation';

export default class CreateProductDiscountCycle extends BaseUseCase {
  async execute(payload: CreateProductDiscountCycleDto) {
    await this.validate(payload);

    const discount = await this.repositories.productDiscountCycleRepository.store(payload);
    await this.syncRemainingKey(discount);

    return discount;
  }

  private async validate(payload: CreateProductDiscountCycleDto) {
    const product = await this.repositories.productRepository.findOne({ id: payload.productId });
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    if (payload.amount > product.price)
      throw new ErrorBadRequest('Diskon tidak boleh lebih besar dari harga produk.');

    const overlap = await this.repositories.productDiscountCycleRepository.existsOverlap(
      payload.productId,
      payload.startDate,
      payload.endDate,
    );
    if (overlap)
      throw new ErrorConflict('Jadwal diskon bentrok dengan cycle lain untuk product ini.');
  }

  private async syncRemainingKey(discount: ProductDiscountCycle) {
    const key = redisRemainingKey(discount.id);

    if (discount.quota == null) return this.repositories.redisRepository.destroy(key);

    await this.repositories.redisRepository.store({
      key,
      value: String(remainingQuota(discount) ?? 0),
      expired: discountTtlSeconds(discount.endDate),
      logging: false,
    });
  }
}
