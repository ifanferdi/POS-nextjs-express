import type { StringValue } from 'ms';

type Timeout = StringValue | number;

export default {
  mode: (process.env.AUTH_MODE || 'stateless') as 'stateless' | 'stateful',
  use2FA: process.env.AUTH_USE_2FA ? process.env.AUTH_USE_2FA.toLowerCase() === 'true' : false,
  tokenTimeout: (process.env.AUTH_TOKEN_TIMEOUT || '24h') as Timeout, // 24 hours
  refreshTokenTimeout: (process.env.AUTH_REFRESH_TOKEN_TIMEOUT ||
    7 * 24 * 60 * 60 * 1000) as number, // 7 days
  otpTimeout: (process.env.AUTH_OTP_TIMEOUT || '10m') as Timeout, // 10 minutes
  otpTimeoutLabel: process.env.AUTH_OTP_TIMEOUT_LABEL || '10 minutes', // 10 minutes
  otpRateLimitNum: process.env.AUTH_OTP_RATE_LIMIT_NUM || 5,
  otpRateLimitTime: (process.env.AUTH_OTP_RATE_LIMIT_TIME || '10m') as Timeout, // 10 minutes
  need2FAAfterMinutes: Number(process.env.AUTH_NEED_2FA_AFTER_MINUTES) || 15, // 15 minutes
};
