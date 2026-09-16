import checkRefreshToken from '@/helpers/check-refresh-token';
import BaseUseCase from '@/use-cases/_base-use-case';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import { TokenDto } from '@/validations/auth-validation';

export default class RefreshToken extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);

  async execute({ token: refreshToken }: TokenDto) {
    const userAuth = await checkRefreshToken(this.repositories.redisRepository, refreshToken);

    return this.findByIdUser.execute({ id: userAuth.id });
  }
}
