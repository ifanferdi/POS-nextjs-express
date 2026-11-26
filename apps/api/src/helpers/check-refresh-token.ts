import { RedisDataAuth } from '@/domain/entities/types/auth.types';
import { ErrorInternalServer, ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import * as refreshTokenHelper from '@/helpers/refresh-token.helper';
import RedisRepository from '@/repositories/redis/redis-repository';

export default async function (redisRepository: RedisRepository, refreshToken: string) {
  if (!redisRepository) throw new ErrorInternalServer('Redis does not exist.');

  if (!refreshToken) throw new ErrorUnauthorized('No refresh token provided');

  const sessionId = refreshTokenHelper.parseSessionId(refreshToken);

  const redisData: RedisDataAuth = await redisRepository.findOne(jwt.key(sessionId));

  // bandingkan hash, bukan token mentah: isi Redis tidak bisa dipakai kalau bocor
  if (redisData?.refreshTokenHash !== refreshTokenHelper.hash(refreshToken))
    throw new ErrorUnauthorized('Refresh token is invalid or expired.');

  return { userId: redisData.userId, sessionId };
}
