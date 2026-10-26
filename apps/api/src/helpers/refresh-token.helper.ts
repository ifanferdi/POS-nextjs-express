import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ErrorUnauthorized } from '@/helpers/error.helper';

// format: <sessionId>.<secret> — sessionId jadi key Redis, token-nya sendiri hanya disimpan sebagai hash
const SEPARATOR = '.';

export const hash = (refreshToken: string) =>
  createHash('sha256').update(refreshToken).digest('hex');

export const generate = (sessionId: string = randomUUID()) => ({
  sessionId,
  refreshToken: `${sessionId}${SEPARATOR}${randomBytes(32).toString('hex')}`,
});

export const parseSessionId = (refreshToken: string) => {
  const [sessionId, secret] = (refreshToken || '').split(SEPARATOR);

  if (!sessionId || !secret) throw new ErrorUnauthorized('Refresh token is invalid or expired.');

  return sessionId;
};
