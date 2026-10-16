import config from '@/config/config';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser } from '@/domain/entities/models/user';
import { Repositories } from '@/domain/repositories/repositories.interface';
import { extractUserId, getRedisKeyRole } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { Role } from '@/infrastructure/database/prisma/generated/client';
import CheckValidPermission from '@/use-cases/permission/check-valid-permission';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import e from 'express';
const ME_CACHE_TTL = config.redis.meCacheTtl;
export default class Authorization {
  private findByIdUser: FindByIdUser;
  constructor(private readonly repositories: Repositories) {
    this.findByIdUser = new FindByIdUser(this.repositories);
  }

  authorize(permissions: string | string[]) {
    return async (req: e.Request, res: e.Response, next: e.NextFunction) => {
      const userId = extractUserId(req) || 1;

      if (!userId) return next(new ErrorBadRequest(`Headers user_id: must be a number`));

      const isValid = await new CheckValidPermission(this.repositories).execute({
        userId,
        permissions,
      });

      if (!isValid)
        return res
          .status(HttpStatusCode.FORBIDDEN)
          .json({ message: "You don't have the permission to access this resource!" });

      return next();
    };
  }

  async hasPermission(userId: number, permissions: string | string[]) {
    return await new CheckValidPermission(this.repositories).execute({ userId, permissions });
  }

  async hasRole(id: number, roles: string[] | string) {
    const redisKey = getRedisKeyRole(id);

    const cached = (await this.repositories.redisRepository.findOne(redisKey)) as {
      name: string;
    } | null;

    let roleName = cached?.name;

    if (!roleName) {
      const user = await this.findByIdUser.execute<IUser & { role: Role }>({
        id,
        columns: ['id'],
        with: [UserRelation.ROLE],
      });
      roleName = user.role.name;

      await this.repositories.redisRepository.store({
        key: redisKey,
        value: { name: roleName },
        expired: Number(ME_CACHE_TTL),
        logging: false,
      });
    }

    return Array.isArray(roles) && roleName ? roles.includes(roleName) : roleName === roles;
  }
}
