import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

export default class DeleteProductCategory extends BaseUseCase {
  execute({ id }: BaseFindById) {
    return this.repositories.productCategoryRepository.destroy(id);
  }
}
