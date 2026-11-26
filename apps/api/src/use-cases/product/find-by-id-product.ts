import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { ProductCategories } from '@/domain/entities/models/product';
import {
  applyActiveDiscount,
  extractCategories,
  handleProductImageUrl,
} from '@/helpers/data-extractor';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdProductDto } from '@/validations/product-validation';

export default class FindByIdProduct extends BaseUseCase {
  async execute(params: FindByIdProductDto) {
    const product = await this.repositories.productRepository.findOne<ProductCategories>(params);
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    await handleProductImageUrl(this.repositories.storageRepository, product);
    extractCategories(product);

    if (params.with?.includes(ProductRelation.DISCOUNT_CYCLES)) {
      const discounts = await this.repositories.productDiscountCycleRepository.findActive(
        [product.id],
        new Date(),
      );
      applyActiveDiscount([product], discounts);
    }

    return product;
  }
}
