import { ProductCategories } from '@/domain/entities/models/product';
import { extractCategories, handleProductImageUrl } from '@/helpers/data-extractor';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdProductDto } from '@/validations/product-validation';

export default class FindByIdProduct extends BaseUseCase {
  async execute(params: FindByIdProductDto) {
    const product = await this.repositories.productRepository.findOne<ProductCategories>(params);
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    await handleProductImageUrl(this.repositories.storageRepository, product);
    extractCategories(product);

    return product;
  }
}
