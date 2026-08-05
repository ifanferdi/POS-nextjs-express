import { ErrorBadRequest } from '../../helpers/error.helper';
import { UpdateCategoryDto } from '../../validations/category-validation';
import BaseUseCase from '../_base-use-case';

export default class UpdateCategory extends BaseUseCase {
  async execute(payload: UpdateCategoryDto) {
    await this.checkUniqueName(payload.name, payload.id);

    return this.repositories.categoryRepository.update(payload);
  }

  private async checkUniqueName(name: string, id?: number) {
    const count = await this.repositories.categoryRepository.count({
      name,
      notId: id,
    });

    if (count > 0) throw new ErrorBadRequest('Nama kategori telah digunakan.');
  }
}
