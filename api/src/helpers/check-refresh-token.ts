import _ from 'lodash';
import { IUser } from '@/domain/entities/models/user';
import { JwtData, RedisDataAuth } from '@/domain/entities/types/auth.types';
import RedisRepository from '@/repositories/redis/redis-repository';
import { ErrorInternalServer, ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';

export default async function (redisRepository?: RedisRepository, refreshToken?: string) {
  if (!redisRepository) throw new ErrorInternalServer('Redis does not exist.');

  if (!refreshToken) throw new ErrorUnauthorized('No refresh token provided');

  const refreshTokenData: JwtData = jwt.verify(refreshToken);

  const redisData: RedisDataAuth = await redisRepository.findOne(jwt.key(refreshTokenData.id));

  if (refreshTokenData?.isBearerToken || redisData?.refreshToken !== refreshToken)
    throw new ErrorUnauthorized('Refresh token is invalid or expired.');

  if (refreshTokenData.iat) refreshTokenData.iatDate = new Date(refreshTokenData.iat * 1000);
  if (refreshTokenData.exp) refreshTokenData.expDate = new Date(refreshTokenData.exp * 1000);

  return _.omit(refreshTokenData, ['isBearerToken', 'iat', 'exp', 'iatDate', 'expDate']) as IUser;
}
