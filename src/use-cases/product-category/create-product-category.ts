import { ErrorBadRequest } from '../../helpers/error.helper';
import { CreateProductCategoryDto } from '../../validations/product-category-validation';
import BaseUseCase from '../_base-use-case';

export default class CreateProductCategory extends BaseUseCase {
  async execute(payload: CreateProductCategoryDto) {
    await this.checkUniqueName(payload.name);

    return this.repositories.productCategoryRepository.store(payload);
  }

  private async checkUniqueName(name: string) {
    const count = await this.repositories.productCategoryRepository.count({ search: name });

    if (count > 0) throw new ErrorBadRequest('Nama kategori telah digunakan.');
  }
}
