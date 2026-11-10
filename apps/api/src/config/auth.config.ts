import type { StringValue } from 'ms';

type Timeout = StringValue | number;

export default {
  mode: (process.env.AUTH_MODE || 'stateless') as 'stateless' | 'stateful',
  use2FA: process.env.AUTH_USE_2FA ? process.env.AUTH_USE_2FA.toLowerCase() === 'true' : false,
  tokenTimeout: (process.env.AUTH_TOKEN_TIMEOUT || '7h') as Timeout, // 24 hours
  refreshTokenTimeout: (process.env.AUTH_REFRESH_TOKEN_TIMEOUT ||
    30 * 24 * 60 * 60 * 1000) as number, // 30 days
  otpTimeout: (process.env.AUTH_OTP_TIMEOUT || '10m') as Timeout, // 10 minutes
  otpTimeoutLabel: process.env.AUTH_OTP_TIMEOUT_LABEL || '10 minutes', // 10 minutes
  // Tanpa default: alamat email penerima OTP wajib dari env (sebelumnya
  // hardcoded alamat developer pribadi).
  otpEmail: process.env.AUTH_OTP_EMAIL,
  otpRateLimitNum: process.env.AUTH_OTP_RATE_LIMIT_NUM || 5,
  otpRateLimitTime: (process.env.AUTH_OTP_RATE_LIMIT_TIME || '10m') as Timeout, // 10 minutes
  // Anti brute-force sign-in: N kegagalan per IP+username dalam window ini → 429.
  loginRateLimitNum: Number(process.env.AUTH_LOGIN_RATE_LIMIT_NUM) || 10,
  loginRateLimitTime: (process.env.AUTH_LOGIN_RATE_LIMIT_TIME || '15m') as Timeout,
  need2FAAfterMinutes: Number(process.env.AUTH_NEED_2FA_AFTER_MINUTES) || 15, // 15 minutes
};
