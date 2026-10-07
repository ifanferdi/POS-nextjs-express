import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { ProductCategories } from '@/domain/entities/models/product';
import { extractCategories, handleProductImageUrl } from '@/helpers/data-extractor';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllProductDto } from '@/validations/product-validation';

export default class FindAllProduct extends BaseUseCase {
  async execute(params: FindAllProductDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.productRepository.findAll(params);
    const total = await this.repositories.productRepository.count(params);

    await Promise.all(
      data.map((product) => {
        handleProductImageUrl(this.repositories.storageRepository, product);
        if (params.with?.includes(ProductRelation.CATEGORIES))
          extractCategories(product as ProductCategories);
      }),
    );

    return paginate({ page, limit, total, data });
  }
}
