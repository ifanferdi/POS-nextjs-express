import paginate from '@/helpers/paginate.helper';
import { FindAllCategoryDto } from '@/validations/category-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindAllCategory extends BaseUseCase {
  async execute(params: FindAllCategoryDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.categoryRepository.findAll(params);
    const total = await this.repositories.categoryRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}