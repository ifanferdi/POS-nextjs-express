import config from '@/config/config';
import checkRefreshToken from '@/helpers/check-refresh-token';
import { TokenDto } from '@/validations/auth-validation';
import BaseUseCase from '@/use-cases/_base-use-case';
import FindByIdUser from '@/use-cases/user/find-by-id-user';

const REFRESH_TOKEN_TIMEOUT = config.auth.refreshTokenTimeout;

export default class RefreshToken extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);

  async execute({ token: refreshToken }: TokenDto) {
    const userAuth = await checkRefreshToken(this.repositories.redisRepository);

    return this.findByIdUser.execute({ id: userAuth.id });
  }
}
