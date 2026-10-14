import { HttpStatusCode } from '@/constants/http-status.constant';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import { IUser } from '@/domain/entities/models/user';
import { Repositories } from '@/domain/repositories/repositories.interface';
import { extractUserId } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { Role } from '@/infrastructure/database/prisma/generated/client';
import CheckValidPermission from '@/use-cases/permission/check-valid-permission';
import FindByIdUser from '@/use-cases/user/find-by-id-user';
import e from 'express';

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
    const user = (await this.findByIdUser.execute({ id, with: [UserRelation.ROLE] })) as IUser & {
      role: Role;
    };
    const roleName = user.role.name;

    return Array.isArray(roles) && roleName ? roles.includes(roleName) : roleName === roles;
  }
}
