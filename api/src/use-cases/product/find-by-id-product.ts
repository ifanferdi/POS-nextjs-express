import { IProduct } from '@/domain/entities/models/product';
import { isLink } from '@/helpers/common.helper';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdProductDto } from '@/validations/product-validation';

export default class FindByIdProduct extends BaseUseCase {
  async execute(params: FindByIdProductDto) {
    const product = (await this.repositories.productRepository.findOne(params)) as IProduct;
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    await this.handleProductImageUrl(product);
    this.extractCategories(product);

    return product;
  }

  private extractCategories(product: IProduct) {
    if (product.productHasCategories) {
      product.categories = product.productHasCategories.map((phc) => phc.category!);
      delete (product as any).productHasCategories;
    }
  }

  private async handleProductImageUrl(product: IProduct) {
    if (product.imagePath)
      product.imageUrl = isLink(product.imagePath)
        ? product.imagePath
        : await this.repositories.storageRepository?.getUrl(product.imagePath);
  }
}
