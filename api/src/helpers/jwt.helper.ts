import * as jwt from 'jsonwebtoken';
import { TokenExpiredError } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import config from '@/config/config';
import { JwtData } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';

const SECRET = config.secret;
const TIMEOUT = config.auth.tokenTimeout;

export function hash(data: Record<string, any>, expiresIn: number | StringValue = TIMEOUT) {
  return jwt.sign(data, SECRET, { expiresIn });
}

export function verify(token: string) {
  try {
    return jwt.verify(token, SECRET) as JwtData;
  } catch (e) {
    if (e instanceof TokenExpiredError) throw new ErrorUnauthorized(e.message);
    throw e; // rethrow others
  }
}

export const key = (id: number) => `jwt:user-${id}`;
