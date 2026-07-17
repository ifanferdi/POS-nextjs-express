import _ from 'lodash';
import { IPermission } from '../../../domain/entities/models/permission';
import { CreateRoleDto } from '../../../validations/role-validation';

export default function RoleFactory(permissions: IPermission[]) {
  const permissionByName = _.keyBy(permissions, 'name');

  const rolePermissions: Record<string, string[]> = {
    Developer: [
      'Manage User',
      'Show User',
      'Manage Role',
      'Show Role',
      'Manage Permission',
      'Show Permission',
      'Manage Product Category',
      'Show Product Category',
      'Manage Product',
      'Show Product',
      'Manage Order',
      'Show Order',
      'Manage Payment',
      'Show Payment',
    ],
    Admin: [
      'Manage User',
      'Show User',
      'Manage Role',
      'Show Role',
      'Manage Product Category',
      'Show Product Category',
      'Manage Product',
      'Show Product',
      'Manage Order',
      'Show Order',
      'Manage Payment',
      'Show Payment',
    ],
    User: ['Manage User', 'Show User'],
  };

  const roleFactories: CreateRoleDto[] = [];
  Object.keys(rolePermissions).map((role, index) =>
    roleFactories.push({
      id: index + 1,
      name: role,
      permissionIds: rolePermissions[role].map((permission) => permissionByName[permission].id),
    }),
  );

  return roleFactories;
}
