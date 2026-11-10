import config from '@/config/config';
import { JwtData } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const SECRET = config.secret;
const TIMEOUT = config.auth.tokenTimeout;

export function hash(data: Record<string, any>, expiresIn: number | StringValue = TIMEOUT) {
  return jwt.sign(data, SECRET, { expiresIn });
}

export function verify(token: string) {
  try {
    return jwt.verify(token, SECRET) as JwtData;
  } catch (e) {
    // Semua kegagalan verifikasi token adalah masalah auth klien → 401,
    // bukan 500 (sebelumnya hanya expiry yang dipetakan).
    if (e instanceof TokenExpiredError || e instanceof JsonWebTokenError || e instanceof NotBeforeError)
      throw new ErrorUnauthorized(e.message);
    throw e;
  }
}

export const key = (sessionId: string) => `jwt:session-${sessionId}`;
