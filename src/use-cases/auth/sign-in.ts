import _ from 'lodash';
import moment from 'moment';
import config from '../../config/config';
import { UserRelation } from '../../domain/entities/enums/user.enum';
import { IUser, IUserWithPassword, USER_FIELDS } from '../../domain/entities/models/user';
import { RedisDataAuth } from '../../domain/entities/types/auth.types';
import { ttl } from '../../helpers/common.helper';
import { ErrorBadRequest } from '../../helpers/error.helper';
import * as jwt from '../../helpers/jwt.helper';
import * as password from '../../helpers/password.helper';
import { SignInAuthDto } from '../../validations/auth-validation';
import BaseUseCase from '../_base-use-case';
import SendOtp from './2FA/send-otp';

const TOKEN_TIMEOUT = config.auth.tokenTimeout;
const REFRESH_TOKEN_TIMEOUT = config.auth.refreshTokenTimeout;
const AUTH_MODE = config.auth.mode;
const IS_USE_2FA = config.auth.use2FA;
const NEED_2FA_AFTER_MINUTES = config.auth.need2FAAfterMinutes;

export default class SignIn extends BaseUseCase {
  getToken = (user: IUser & { isBearerToken?: boolean }) => jwt.hash(user, TOKEN_TIMEOUT);

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

    if (AUTH_MODE === 'stateful') {
      if (IS_USE_2FA) return await this.handle2FA(userWithoutPassword);

      return await this.handleStatefulMode(userWithoutPassword);
    }

    const token = this.getToken(userWithoutPassword);

    return { token, user: userWithoutPassword };
  }

  async handleStatefulMode(user: IUser) {
    const token = this.getToken({ ...user, isBearerToken: true });
    const { exp: tokenExpiry } = jwt.verify(token);

    const refreshToken = jwt.hash(user, REFRESH_TOKEN_TIMEOUT);

    const redisDataAuth: RedisDataAuth = { token, refreshToken, createdAt: new Date() };
    await this.storeTokenToRedis(redisDataAuth, user.id);

    return { token, refreshToken, tokenExpiry, user };
  }

  private async storeTokenToRedis(value: RedisDataAuth, id: number) {
    await this.repositories.redisRepository?.store({
      key: jwt.key(id),
      value,
      expired: ttl(REFRESH_TOKEN_TIMEOUT),
      logging: false,
    });
  }

  private async handle2FA(user: IUser, newMacAddress?: string) {
    const previousSession = (await this.repositories.redisRepository?.findOne(
      jwt.key(user.id),
    )) as RedisDataAuth;

    const diffInMinutes = moment().diff(moment(previousSession?.createdAt), 'minutes');
    // check if under 15 minutes & with same device, no need 2FA
    if (
      !newMacAddress ||
      (previousSession.macAddress !== newMacAddress && diffInMinutes > NEED_2FA_AFTER_MINUTES)
    ) {
      await new SendOtp(this.repositories).execute(user);
      return { isNeed2FA: true, userId: user.id };
    }

    return await this.handleStatefulMode(user);
  }
}
