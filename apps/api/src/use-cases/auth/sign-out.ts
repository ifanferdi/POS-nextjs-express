import config from '@/config/config';
import * as jwt from '@/helpers/jwt.helper';
import BaseUseCase from '@/use-cases/_base-use-case';

const AUTH_MODE = config.auth.mode;

export default class SignOut extends BaseUseCase {
  async execute({ sessionId }: { sessionId?: string }) {
    if (AUTH_MODE === 'stateful' && sessionId)
      await this.repositories.redisRepository.destroy(jwt.key(sessionId));

    return true;
  }
}
