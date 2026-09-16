import { ProductCategories } from '@/domain/entities/models/product';
import { extractCategories, handleProductImageUrl } from '@/helpers/data-extractor';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllProductDto } from '@/validations/product-validation';

export default class FindAllProduct extends BaseUseCase {
  async execute(params: FindAllProductDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.productRepository.findAll<ProductCategories>(params);
    const total = await this.repositories.productRepository.count(params);

    await Promise.all(
      data.map((product) => {
        extractCategories(product);
        handleProductImageUrl(this.repositories.storageRepository, product);
      }),
    );

    return paginate({ page, limit, total, data });
  }
}
