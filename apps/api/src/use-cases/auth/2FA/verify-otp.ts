import { IUser } from '@/domain/entities/models/user';
import { ErrorBadRequest, ErrorNotFound, ErrorUnauthorized } from '@/helpers/error.helper';
import * as password from '@/helpers/password.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import SendOtp from '@/use-cases/auth/2FA/send-otp';
import SignIn from '@/use-cases/auth/sign-in';

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
    const hashedOtp = await this.repositories.redisRepository.findOne(key);
    if (!hashedOtp) throw new ErrorUnauthorized('Invalid verify OTP request.');

    // VERIFY OTP
    const isValidOtp = await password.verify(hashedOtp, params.otp);

    if (!isValidOtp) {
      console.error(`Invalid OTP attempt for user id ${params.userId}.`);
      throw new ErrorBadRequest('Invalid Otp.');
    }

    // DELETE REDIS IF OTP HAS BEEN VERIFIED
    await this.repositories.redisRepository.destroy(key);
    await this.repositories.redisRepository.destroy(rateLimiterKey);

    return await new SignIn(this.repositories).handleStatefulMode(user);
  }
}
