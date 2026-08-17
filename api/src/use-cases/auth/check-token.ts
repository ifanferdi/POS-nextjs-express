import config from '@/config/config';
import { JwtData, RedisDataAuth } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import { TokenDto } from '@/validations/auth-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

const AUTH_MODE = config.auth.mode;

export default class CheckToken extends BaseUseCase {
  async execute({ token }: TokenDto) {
    const tokenData: JwtData = jwt.verify(token);

    // check token to redis if stateful mode
    if (AUTH_MODE === 'stateful') {
      // cek apakah token masih ada di redis atau sudah dihapus (sign out) / expired
      // note: 1 akun hanya 1 device, karna cache token akan ketimpa kalo ada login di device lain
      const redisData: RedisDataAuth = await this.repositories.redisRepository?.findOne(
        jwt.key(tokenData.id),
      );

      if (redisData?.token !== token || !tokenData.isBearerToken)
        throw new ErrorUnauthorized('Token tidak valid atau kadaluarsa.');
    }

    if (tokenData.iat) tokenData.iatDate = new Date(tokenData.iat * 1000);
    if (tokenData.exp) tokenData.expDate = new Date(tokenData.exp * 1000);

    return tokenData;
  }
}
