import { IUser } from '@/domain/entities/models/user';
import { ErrorBadRequest, ErrorNotFound, ErrorUnauthorized } from '@/helpers/error.helper';
import * as password from '@/helpers/password.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import SignIn from '@/use-cases/auth/sign-in';
import SendOtp from '@/use-cases/auth/2FA/send-otp';

export default class VerifyOtp extends BaseUseCase {
  private sendOtp = new SendOtp(this.repositories);

  async execute(params: { otp: string; userId: number }) {
    const key = this.sendOtp.key(params.userId);
    const rateLimiterKey = this.sendOtp.rateLimiterKey(params.userId);

    const user = (await this.repositories.userRepository.findOne({
      id: params.userId,
    })) as IUser;
    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    // GET HASHED OTO FROM REDIS
    const hashedOtp = await this.repositories.redisRepository?.findOne(key);
    if (!hashedOtp) throw new ErrorUnauthorized('Invalid verify OTP request.');

    // VERIFY OTP
    const isValidOtp = await password.verify(hashedOtp, params.otp);

    if (!isValidOtp) {
      console.error(`⚠️  User id {${params.userId}} has been send invalid OTP: ${params.otp}`);
      throw new ErrorBadRequest(`Invalid Otp: ${params.otp}`);
    }

    // DELETE REDIS IF OTP HAS BEEN VERIFIED
    await this.repositories.redisRepository?.destroy(key);
    await this.repositories.redisRepository?.destroy(rateLimiterKey);

    return await new SignIn(this.repositories).handleStatefulMode(user);
  }
}
