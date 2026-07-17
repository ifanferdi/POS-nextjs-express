import { ErrorNotFound } from '../../helpers/error.helper';
import { FindByIdProductCategoryDto } from '../../validations/product-category-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdProductCategory extends BaseUseCase {
  async execute(params: FindByIdProductCategoryDto) {
    const category = await this.repositories.productCategoryRepository.findOne(params);
    if (!category) throw new ErrorNotFound('Kategori produk tidak ditemukan');

    return category;
  }
}
