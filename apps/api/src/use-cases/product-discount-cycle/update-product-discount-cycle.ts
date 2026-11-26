import {
  discountTtlSeconds,
  isDiscountActive,
  redisRemainingKey,
  remainingQuota,
} from '@/helpers/discount.helper';
import { ErrorBadRequest, ErrorConflict, ErrorNotFound } from '@/helpers/error.helper';
import { ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UpdateProductDiscountCycleDto } from '@/validations/product-discount-cycle-validation';

export default class UpdateProductDiscountCycle extends BaseUseCase {
  async execute(payload: UpdateProductDiscountCycleDto) {
    const existing =
      await this.repositories.productDiscountCycleRepository.findOne<ProductDiscountCycle>({
        id: payload.id,
      });
    if (!existing) throw new ErrorNotFound('Diskon tidak ditemukan');

    await this.validate(payload, existing);

    const discount = await this.repositories.productDiscountCycleRepository.update(payload);
    await this.syncRemainingKey(discount);

    return discount;
  }

  private async validate(payload: UpdateProductDiscountCycleDto, existing: ProductDiscountCycle) {
    // Cycle yang sudah berjalan tidak boleh diubah — order bisa sudah memakai snapshot-nya.
    if (isDiscountActive(existing, new Date()))
      throw new ErrorConflict('Diskon yang sedang aktif tidak dapat diubah.');

    const productId = payload.productId ?? existing.productId;
    const amount = payload.amount ?? existing.amount;
    const startDate = payload.startDate ?? existing.startDate;
    const endDate = payload.endDate ?? existing.endDate;

    if (endDate <= startDate) throw new ErrorBadRequest('End date harus setelah start date.');

    const product = await this.repositories.productRepository.findOne({ id: productId });
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    if (amount > product.price)
      throw new ErrorBadRequest('Diskon tidak boleh lebih besar dari harga produk.');

    const overlap = await this.repositories.productDiscountCycleRepository.existsOverlap(
      productId,
      startDate,
      endDate,
      payload.id,
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
