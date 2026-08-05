import { ErrorNotFound } from '../../helpers/error.helper';
import { FindByIdCategoryDto } from '../../validations/category-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdCategory extends BaseUseCase {
  async execute(params: FindByIdCategoryDto) {
    const category = await this.repositories.categoryRepository.findOne(params);
    if (!category) throw new ErrorNotFound('Kategori tidak ditemukan');

    return category;
  }
}