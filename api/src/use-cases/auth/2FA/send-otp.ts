import config from '@/config/config';
import { IUser } from '@/domain/entities/models/user';
import { ttl } from '@/helpers/common.helper';
import AppError from '@/helpers/error.helper';
import { generateOtp } from '@/helpers/generate-string';
import * as password from '@/helpers/password.helper';
import BaseUseCase from '@/use-cases/_base-use-case';

const APP_NAME = config.app.name;
const OTP_TIMEOUT = config.auth.otpTimeout;
const OTP_TIMEOUT_LABEL = config.auth.otpTimeoutLabel;
const OTP_RATE_LIMIT_NUM = Number(config.auth.otpRateLimitNum);
const OTP_RATE_LIMIT_TIME = config.auth.otpRateLimitTime;

export default class SendOtp extends BaseUseCase {
  key = (id: number) => `2fa:user-${id}`;
  rateLimiterKey = (id: number) => `2fa-rate-limiter:user-${id}`;

  async execute(user: IUser, isResendOtp?: boolean) {
    // CHECK IS SESSION VALID IF CLIENT REQUEST TO RESEND OTP
    if (isResendOtp) await this.handleIsResendOtpRequest(user.id);

    // CALLING RATE LIMITER
    await this.rateLimiter(user.id);

    const otp = generateOtp();
    const hashedOtp = await password.hash(otp);

    // SENDING TO EMAIL RUN IN BACKGROUND
    this.sendOtpToEmail(otp);

    await this.repositories.redisRepository.store({
      key: this.key(user.id),
      value: hashedOtp,
      expired: ttl(OTP_TIMEOUT),
      logging: false,
    });
  }

  private async handleIsResendOtpRequest(id: number) {
    const isSessionExist = await this.repositories.redisRepository.findOne(this.key(id));

    if (!isSessionExist) throw new AppError('Invalid OTP request. Session does not exist.');
  }

  private async sendOtpToEmail(otp: string, email = 'ifan.develop@gmail.com') {
    await this.repositories.nodemailerRepository?.sendMail({
      from: `"${APP_NAME}" <bigdata@pjj-test.dstagingserver.com>`,
      to: email,
      subject: 'Sign In - Your OTP Code Request',
      html: `Your OTP code: <b>${otp}</b>. This code is only valid for ${OTP_TIMEOUT_LABEL}. DO NOT SHARE THE OTP CODE WITH ANYONE, EVER!`, // HTML body
    });
  }

  private async rateLimiter(userId: number) {
    const key = this.rateLimiterKey(userId);
    const currentRequest = (await this.repositories.redisRepository.incr(key)) as number;

    if (currentRequest === 1)
      await this.repositories.redisRepository.expire(key, ttl(OTP_RATE_LIMIT_TIME));

    if (currentRequest > OTP_RATE_LIMIT_NUM)
      throw new AppError('To many OTP request, please try again later.');
  }
}
