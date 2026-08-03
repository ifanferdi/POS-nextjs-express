import e from 'express';
import { HttpStatusCode } from '../../constants/http-status.constant';
import { UserRelation } from '../../domain/entities/enums/user.enum';
import { Repositories } from '../../domain/repositories/repositories.interface';
import { extractUserId } from '../../helpers/common.helper';
import { ErrorBadRequest } from '../../helpers/error.helper';
import { FindByIdUserDto } from '../../validations/user-validation';
import CheckValidPermission from '../permission/check-valid-permission';
import FindByIdUser from '../user/find-by-id-user';

export default class Authorization {
  constructor(private readonly repositories: Repositories) {}

  authorize(permissions: string | string[]) {
    return async (req: e.Request, res: e.Response, next: e.NextFunction) => {
      const userId = extractUserId(req) || 1;

      if (!userId) return next(new ErrorBadRequest(`Headers user_id: must be a number`));

      const isValid = await new CheckValidPermission(this.repositories).execute({
        userId,
        permissions,
      });

      console.log(
        await new FindByIdUser(this.repositories).execute({
          id: userId,
          with: [UserRelation.PERMISSIONS],
        }),
      );

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
    const roleName = await new FindByIdUser(this.repositories)
      .execute({ id, with: ['role'] } as FindByIdUserDto)
      .then((res) => res.role?.name);

    return Array.isArray(roles) && roleName ? roles.includes(roleName) : roleName === roles;
  }
}
