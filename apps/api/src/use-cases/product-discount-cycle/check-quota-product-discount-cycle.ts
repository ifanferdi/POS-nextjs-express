import {
  CheckQuotaProductDiscountCycleResult,
  InvalidDiscountQuota,
} from '@/domain/use-cases/product-discount-cycle.interface';
import { ensureRemainingCounter } from '@/helpers/discount.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CheckQuotaProductDiscountCycleDto } from '@/validations/product-discount-cycle-validation';

export default class CheckQuotaProductDiscountCycle extends BaseUseCase {
  async execute(
    items: CheckQuotaProductDiscountCycleDto,
  ): Promise<CheckQuotaProductDiscountCycleResult> {
    // Produk sama boleh muncul >1 entry → jumlahkan qty sebelum dicek.
    const quantities = new Map<number, number>();
    items.forEach((item) =>
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity),
    );

    const discounts = await this.repositories.productDiscountCycleRepository.findActive(
      [...quantities.keys()],
      new Date(),
    );
    const discountMap = new Map(discounts.map((discount) => [discount.productId, discount]));

    const invalid: InvalidDiscountQuota[] = [];

    for (const [productId, quantity] of quantities) {
      const discount = discountMap.get(productId);
      if (!discount) {
        invalid.push({ productId, itemLeft: 0 });
        continue;
      }
      if (discount.quota == null) continue;

      const remaining =
        (await ensureRemainingCounter(discount, this.repositories.redisRepository)) ?? 0;
      if (remaining < quantity) invalid.push({ productId, itemLeft: remaining });
    }

    return invalid.length ? { valid: false, invalid } : { valid: true };
  }
}
