import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

export default class CancelOrder extends BaseUseCase {
  execute({ id }: BaseFindById) {
    return this.repositories.orderRepository.cancelOrder(id);
  }
}
