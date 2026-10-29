import { FindAllOrderDto } from '@/validations/order-validation';
import BaseUseCase from '../_base-use-case';
import Authorization from '../auth/authorization';

export default class AuthorizationOrder extends BaseUseCase {
  private authorization = new Authorization(this.repositories);

  async all(params: FindAllOrderDto, userId: number) {
    if (await this.authorization.hasRole(userId, 'User')) params.userId = userId;

    return params;
  }
}
