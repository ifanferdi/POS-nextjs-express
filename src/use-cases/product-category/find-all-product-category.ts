import paginate from '../../helpers/paginate.helper';
import { FindAllProductCategoryDto } from '../../validations/product-category-validation';
import BaseUseCase from '../_base-use-case';

export default class FindAllProductCategory extends BaseUseCase {
  async execute(params: FindAllProductCategoryDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.productCategoryRepository.findAll(params);
    const total = await this.repositories.productCategoryRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}
