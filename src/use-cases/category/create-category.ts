import { ErrorBadRequest } from '../../helpers/error.helper';
import { CreateCategoryDto } from '../../validations/category-validation';
import BaseUseCase from '../_base-use-case';

export default class CreateCategory extends BaseUseCase {
  async execute(payload: CreateCategoryDto) {
    await this.checkUniqueName(payload.name);

    return this.repositories.categoryRepository.store(payload);
  }

  private async checkUniqueName(name: string) {
    const count = await this.repositories.categoryRepository.count({ search: name });

    if (count > 0) throw new ErrorBadRequest('Nama kategori telah digunakan.');
  }
}