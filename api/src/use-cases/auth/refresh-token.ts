import config from '@/config/config';
import { IUser, USER_SELECT_FIELDS } from '@/domain/entities/models/user';
import { RedisDataAuth } from '@/domain/entities/types/auth.types';
import checkRefreshToken from '@/helpers/check-refresh-token';
import { ttl } from '@/helpers/common.helper';
import { ErrorNotFound } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import SignIn from '@/use-cases/auth/sign-in';
import { TokenDto } from '@/validations/auth-validation';

const REFRESH_TOKEN_TIMEOUT = config.auth.refreshTokenTimeout;

export default class RefreshToken extends BaseUseCase {
  async execute({ token: refreshToken }: TokenDto) {
    const userData = await checkRefreshToken(this.repositories.redisRepository, refreshToken);

    return this.handleStatefulMode(userData, refreshToken);
  }

  async handleStatefulMode(user: IUser, refreshToken: string) {
    const token = new SignIn(this.repositories).getToken({ ...user, isBearerToken: true });
    const timeRemaining = await this.repositories.redisRepository.getExpireInSecond(
      jwt.key(user.id),
    );
    const { exp } = jwt.verify(token);

    const redisDataAuth: RedisDataAuth = { token, refreshToken, createdAt: new Date() };
    await this.storeTokenToRedis(
      redisDataAuth,
      user.id,
      timeRemaining ?? ttl(REFRESH_TOKEN_TIMEOUT),
    );

    const checkUser = await this.repositories.userRepository.findOne({
      id: user.id,
      columns: USER_SELECT_FIELDS,
    });
    if (!checkUser) throw new ErrorNotFound('User invalid');

    return { token, refreshToken, exp, user };
  }

  private async storeTokenToRedis(value: RedisDataAuth, id: number, expired: number) {
    await this.repositories.redisRepository.store({
      key: jwt.key(id),
      value,
      logging: false,
      expired,
    });
  }
}
