import { IProduct } from '../../domain/entities/models/product';
import { ErrorNotFound } from '../../helpers/error.helper';
import { FindByIdProductDto } from '../../validations/product-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdProduct extends BaseUseCase {
  async execute(params: FindByIdProductDto) {
    const product = (await this.repositories.productRepository.findOne(params)) as IProduct;
    if (!product) throw new ErrorNotFound('Produk tidak ditemukan');

    this.extractCategories(product);

    return product;
  }

  private extractCategories(product: IProduct) {
    if (product.productHasCategories) {
      product.categories = product.productHasCategories.map((phc) => phc.category!);
      delete (product as any).productHasCategories;
    }
  }
}
