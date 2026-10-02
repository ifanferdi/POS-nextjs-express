import { BaseFindById } from '@/validations/base-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class DeleteCategory extends BaseUseCase {
  execute({ id }: BaseFindById) {
    return this.repositories.categoryRepository.destroy(id);
  }
}