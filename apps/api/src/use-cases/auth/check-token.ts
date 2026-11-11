import config from '@/config/config';
import { JwtData } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { TokenDto } from '@/validations/auth-validation';

const AUTH_MODE = config.auth.mode;


export default class CheckToken extends BaseUseCase {
  async execute({ token }: TokenDto) {
    const tokenData: JwtData = jwt.verify(token);

    // Pencabutan sesi (mode stateful): token yang session-nya sudah
    // logout/dihapus dari Redis tidak lagi berlaku.
    if (AUTH_MODE === 'stateful' && tokenData.sessionId) {
      const session = await this.repositories.redisRepository.findOne(
        jwt.key(tokenData.sessionId),
      );
      if (!session) throw new ErrorUnauthorized('Session tidak valid. Silakan login kembali.');
    }

    // User dinonaktifkan/dihapus → token tidak berlaku (sebelumnya JWT-only
    // tetap bisa diakses sampai token kedaluwarsa).
    const activeUser = await this.repositories.userRepository.findOne({
      id: tokenData.id,
      isActive: true,
      columns: ['id'],
    });
    if (!activeUser) throw new ErrorUnauthorized('Pengguna tidak aktif.');

    if (tokenData.iat) tokenData.iatDate = new Date(tokenData.iat * 1000);
    if (tokenData.exp) tokenData.expDate = new Date(tokenData.exp * 1000);

    return tokenData;
  }
}
