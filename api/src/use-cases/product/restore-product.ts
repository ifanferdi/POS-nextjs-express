import { BaseFindById } from '@/validations/base-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class RestoreProduct extends BaseUseCase {
  execute({ id }: BaseFindById) {
    return this.repositories.productRepository.restore(id);
  }
}
