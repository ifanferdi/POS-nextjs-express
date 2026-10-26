import config from '@/config/config';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser, IUserWithPassword, USER_FIELDS } from '@/domain/entities/models/user';
import { RedisDataAuth } from '@/domain/entities/types/auth.types';
import { ttl } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import * as password from '@/helpers/password.helper';
import * as refreshTokenHelper from '@/helpers/refresh-token.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { SignInAuthDto } from '@/validations/auth-validation';
import _ from 'lodash';

const TOKEN_TIMEOUT = config.auth.tokenTimeout;
const REFRESH_TOKEN_TIMEOUT = config.auth.refreshTokenTimeout;
const AUTH_MODE = config.auth.mode;
const IS_USE_2FA = config.auth.use2FA;
const NEED_2FA_AFTER_MINUTES = config.auth.need2FAAfterMinutes;

export default class SignIn extends BaseUseCase {
  getToken = (user: IUser & {  sessionId?: string }) =>
    jwt.hash(user, TOKEN_TIMEOUT);

  async execute(params: SignInAuthDto) {
    const user = (await this.repositories.userRepository.findOne({
      username: params.username,
      isActive: true,
      with: [UserRelation.PROFILE],
      columns: USER_FIELDS,
    })) as IUserWithPassword;

    if (!user) throw new ErrorBadRequest('Username atau password tidak valid.');

    const isValidPassword = await password.verify(user?.password, params.password);

    if (!isValidPassword) throw new ErrorBadRequest('Username atau password tidak valid.');

    const userWithoutPassword = _.omit(user, 'password') as IUser;

    if (AUTH_MODE === 'stateful') return await this.handleStatefulMode(userWithoutPassword);

    const token = this.getToken(userWithoutPassword);

    return { token, user: userWithoutPassword };
  }

  async handleStatefulMode(user: IUser, sessionId?: string) {
    const session = refreshTokenHelper.generate(sessionId);
    const token = this.getToken({ ...user,  sessionId: session.sessionId });
    const { exp } = jwt.verify(token);

    const redisDataAuth: RedisDataAuth = {
      userId: user.id,
      refreshTokenHash: refreshTokenHelper.hash(session.refreshToken),
      createdAt: new Date(),
    };
    await this.storeTokenToRedis(redisDataAuth, session.sessionId);

    return { token, refreshToken: session.refreshToken, exp, user };
  }

  private async storeTokenToRedis(value: RedisDataAuth, sessionId: string) {
    await this.repositories.redisRepository.store({
      key: jwt.key(sessionId),
      value,
      expired: ttl(REFRESH_TOKEN_TIMEOUT),
      logging: false,
    });
  }
}
