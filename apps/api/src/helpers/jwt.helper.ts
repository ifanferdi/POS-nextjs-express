import config from '@/config/config';
import { JwtData } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from 'jsonwebtoken';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const SECRET = config.secret;
const TIMEOUT = config.auth.tokenTimeout;

export function hash(data: Record<string, any>, expiresIn: number | StringValue = TIMEOUT) {
  // Pin algoritma: cegah algorithm-confusion (secret bocor + algo lain).
  return jwt.sign(data, SECRET, { expiresIn, algorithm: 'HS256' });
}

export function verify(token: string) {
  try {
    return jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as JwtData;
  } catch (e) {
    if (
      e instanceof TokenExpiredError ||
      e instanceof JsonWebTokenError ||
      e instanceof NotBeforeError
    )
      throw new ErrorUnauthorized(e.message);
    throw e;
  }
}

export const key = (sessionId: string) => `jwt:session-${sessionId}`;
