import { UserRelation } from '../../domain/entities/enums/user.enum';
import { IRole } from '../../domain/entities/models/role';
import { IUser } from '../../domain/entities/models/user';
import { ErrorNotFound } from '../../helpers/error.helper';
import { FindAllUserDto, FindByIdUserDto } from '../../validations/user-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdUser extends BaseUseCase {
  async execute(params: FindByIdUserDto) {
    const user = (await this.repositories.userRepository.findOne(params)) as IUser;
    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    this.extractRelationData(params, user);

    return user;
  }

  extractRelationData(params: FindAllUserDto | FindByIdUserDto, user: IUser) {
    const _handleRolePermissions = (role: IRole) => {
      if (role.roleHasPermissions)
        role.permissions = role.roleHasPermissions?.map(
          (roleHasPermission) => roleHasPermission.permission!,
        );
      return role;
    };
    const _handlePermissions = (user: IUser) => {
      user.permissions = [];
      user.role?.roleHasPermissions?.map((roleHasPermission) =>
        user.permissions?.push(roleHasPermission.permission!),
      );
    };

    if (params.with?.includes(UserRelation.ROLE_PERMISSIONS) && user.role)
      user.role = _handleRolePermissions(user.role);

    if (params.with?.includes(UserRelation.PERMISSIONS) && user.role) {
      _handlePermissions(user);
      if (
        !params.with?.includes(UserRelation.ROLE_PERMISSIONS) &&
        !params.with?.includes(UserRelation.ROLE)
      )
        delete user.role;
    }

    if (params.with?.includes(UserRelation.ROLE_PERMISSIONS) && user.role)
      delete user.role.roleHasPermissions;
  }
}
