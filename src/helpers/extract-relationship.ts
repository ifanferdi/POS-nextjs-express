import { UserRelation } from '../domain/entities/enums/user.enum';
import { IUser } from '../domain/entities/models/user';
import { FindAllUserDto, FindByIdUserDto } from '../validations/user-validation';

export function extractRelationData(params: FindAllUserDto | FindByIdUserDto, user: IUser) {
  const _handlePermissions = (user: IUser) => {
    user.permissions = [];
    user.role?.roleHasPermissions?.map((roleHasPermission) =>
      user.permissions?.push({ permission: roleHasPermission.permission! }),
    );
  };

  if (params.with?.includes(UserRelation.PERMISSIONS) && user.role) {
    _handlePermissions(user);
    delete user.role;
  }
}
