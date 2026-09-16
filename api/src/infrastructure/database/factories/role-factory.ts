import { CreateRoleDto } from '@/validations/role-validation';
import _ from 'lodash';
import { Permission } from '../prisma/generated/client';

export default function RoleFactory(permissions: Permission[]) {
  const permissionByName = _.keyBy(permissions, 'name');

  const rolePermissions: Record<string, string[]> = {
    Developer: [
      'Manage User',
      'Show User',
      'Manage Role',
      'Show Role',
      'Manage Permission',
      'Show Permission',
      'Manage Category',
      'Show Category',
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
      'Manage Category',
      'Show Category',
      'Manage Product',
      'Show Product',
      'Manage Order',
      'Show Order',
      'Manage Payment',
      'Show Payment',
    ],
    User: ['Manage User', 'Show User'],
  };

  const roleFactories: Array<CreateRoleDto & { id: number }> = [];
  Object.keys(rolePermissions).map((role, index) =>
    roleFactories.push({
      id: index + 1,
      name: role,
      permissionIds: rolePermissions[role].map((permission) => permissionByName[permission].id),
    }),
  );

  return roleFactories;
}
