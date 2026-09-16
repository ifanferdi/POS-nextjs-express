import { HttpStatusCode } from '@/constants/http-status.constant';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser } from '@/domain/entities/models/user';
import { extractUserId } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { Role } from '@/infrastructure/database/prisma/generated/client';
import CheckValidPermission from '@/use-cases/permission/check-valid-permission';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import e from 'express';
import BaseUseCase from '../_base-use-case';

export default class Authorization extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.redisClient);

  authorize(permissions: string | string[]) {
    return async (req: e.Request, res: e.Response, next: e.NextFunction) => {
      const userId = extractUserId(req) || 1;

      if (!userId) return next(new ErrorBadRequest(`Headers user_id: must be a number`));

      const isValid = await new CheckValidPermission(this.redisClient).execute({
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
    return await new CheckValidPermission(this.redisClient).execute({ userId, permissions });
  }

  async hasRole(id: number, roles: string[] | string) {
    const user = (await this.findByIdUser.execute({ id, with: [UserRelation.ROLE] })) as IUser & {
      role: Role;
    };
    const roleName = user.role.name;

    return Array.isArray(roles) && roleName ? roles.includes(roleName) : roleName === roles;
  }
}
