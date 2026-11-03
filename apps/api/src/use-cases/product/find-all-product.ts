import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { IProduct, ProductCategories } from '@/domain/entities/models/product';
import {
  applyActiveDiscount,
  extractCategories,
  handleProductImageUrl,
} from '@/helpers/data-extractor';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllProductDto } from '@/validations/product-validation';

export default class FindAllProduct extends BaseUseCase {
  async execute(params: FindAllProductDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.productRepository.findAll<IProduct>(params);
    const total = await this.repositories.productRepository.count(params);

    await Promise.all(
      data.map((product) => {
        handleProductImageUrl(this.repositories.storageRepository, product);
        if (params.with?.includes(ProductRelation.CATEGORIES))
          extractCategories(product as ProductCategories);
      }),
    );

    if (params.with?.includes(ProductRelation.DISCOUNT_CYCLES)) {
      const discounts = await this.repositories.productDiscountCycleRepository.findActive(
        data.map((product) => product.id),
        new Date(),
      );
      applyActiveDiscount(data, discounts);
    }

    return paginate({ page, limit, total, data });
  }
}
