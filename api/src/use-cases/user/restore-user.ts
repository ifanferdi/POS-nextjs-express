import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

export default class RestoreUser extends BaseUseCase {
  execute({ id }: BaseFindById) {
    return this.repositories.userRepository.restore(id);
  }
}
