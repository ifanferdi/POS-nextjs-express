import { IUser, USER_SELECT_FIELDS } from '@/domain/entities/models/user';
import checkRefreshToken from '@/helpers/check-refresh-token';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import SignIn from '@/use-cases/auth/sign-in';
import { TokenDto } from '@/validations/auth-validation';

export default class RefreshToken extends BaseUseCase {
  async execute({ token: refreshToken }: TokenDto) {
    const { userId, sessionId } = await checkRefreshToken(
      this.repositories.redisRepository,
      refreshToken,
    );

    const user = await this.repositories.userRepository.findOne<IUser>({
      id: userId,
      columns: USER_SELECT_FIELDS,
    });
    if (!user) throw new ErrorNotFound('User invalid');

    // rotasi: access + refresh token baru menimpa sesi yang sama, refresh token lama otomatis mati
    return await new SignIn(this.repositories).handleStatefulMode(user, sessionId);
  }
}
