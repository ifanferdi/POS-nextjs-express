import config from '@/config/config';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser, USER_SELECT_FIELDS } from '@/domain/entities/models/user';
import { ttl } from '@/helpers/common.helper';
import {
  ErrorBadRequest,
  ErrorNotFound,
  ErrorTooManyRequests,
  ErrorUnauthorized,
} from '@/helpers/error.helper';
import * as password from '@/helpers/password.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import SendOtp from '@/use-cases/auth/2FA/send-otp';
import SignIn from '@/use-cases/auth/sign-in';

const OTP_VERIFY_RATE_LIMIT_NUM = Number(config.auth.otpRateLimitNum);
const OTP_VERIFY_RATE_LIMIT_TIME = config.auth.otpRateLimitTime;

export default class VerifyOtp extends BaseUseCase {
  private sendOtp = new SendOtp(this.repositories);
  private verifyRateLimiterKey = (challengeId: string) => `2fa-verify-rate-limiter:${challengeId}`;

  async execute(params: { otp: string; userId: number; challengeId: string }) {
    const key = this.sendOtp.key(params.userId);
    const sendRateLimiterKey = this.sendOtp.rateLimiterKey(params.userId);

    const challenge = (await this.repositories.redisRepository.findOne(key)) as {
      challengeId?: unknown;
      hashedOtp?: unknown;
    } | null;

    if (
      !challenge ||
      challenge.challengeId !== params.challengeId ||
      typeof challenge.hashedOtp !== 'string'
    )
      throw new ErrorUnauthorized('Invalid verify OTP request.');

    const user = (await this.repositories.userRepository.findOne({
      id: params.userId,
      isActive: true,
      with: [UserRelation.PROFILE],
      columns: USER_SELECT_FIELDS,
    })) as IUser;
    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    const verifyRateLimiterKey = this.verifyRateLimiterKey(params.challengeId);
    const attempts = Number(await this.repositories.redisRepository.incr(verifyRateLimiterKey));
    if (attempts === 1)
      await this.repositories.redisRepository.expire(
        verifyRateLimiterKey,
        ttl(OTP_VERIFY_RATE_LIMIT_TIME),
      );

    if (attempts > OTP_VERIFY_RATE_LIMIT_NUM) {
      await this.repositories.redisRepository.destroy(key);
      throw new ErrorTooManyRequests('Terlalu banyak percobaan OTP. Silakan coba lagi nanti.');
    }

    // VERIFY OTP
    const isValidOtp = await password.verify(challenge.hashedOtp, params.otp);

    if (!isValidOtp) {
      console.error(`Invalid OTP attempt for user id ${params.userId}.`);
      throw new ErrorBadRequest('Invalid Otp.');
    }

    // DELETE REDIS IF OTP HAS BEEN VERIFIED
    await this.repositories.redisRepository.destroy(key);
    await this.repositories.redisRepository.destroy(sendRateLimiterKey);
    await this.repositories.redisRepository.destroy(verifyRateLimiterKey);

    return await new SignIn(this.repositories).createAuthResponse(user);
  }
}
