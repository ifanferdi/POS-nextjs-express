import config from '../../config/config';
import * as jwt from '../../helpers/jwt.helper';
import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

const AUTH_MODE = config.auth.mode;

export default class SignOut extends BaseUseCase {
  async execute({ id }: BaseFindById) {
    if (AUTH_MODE === 'stateful') {
      this.destroyToken(id);
      return true;
    }

    return true;
  }

  private destroyToken = (id: number) => this.repositories.redisRepository?.destroy(jwt.key(id));
}
