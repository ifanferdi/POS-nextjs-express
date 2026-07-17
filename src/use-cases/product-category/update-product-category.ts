import { ErrorBadRequest } from '../../helpers/error.helper';
import { UpdateProductCategoryDto } from '../../validations/product-category-validation';
import BaseUseCase from '../_base-use-case';

export default class UpdateProductCategory extends BaseUseCase {
  async execute(payload: UpdateProductCategoryDto) {
    await this.checkUniqueName(payload.name, payload.id);

    return this.repositories.productCategoryRepository.update(payload);
  }

  private async checkUniqueName(name: string, id?: number) {
    const count = await this.repositories.productCategoryRepository.count({
      search: name,
      notId: id,
    });

    if (count > 0) throw new ErrorBadRequest('Nama kategori telah digunakan.');
  }
}
