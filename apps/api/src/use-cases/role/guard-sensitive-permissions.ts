import { Repositories } from '@/domain/repositories/repositories.interface';
import { ErrorForbidden } from '@/helpers/error.helper';

const SENSITIVE_PERMISSIONS = ['Show Permission', 'Manage Permission'];

type SensitivePermissionPayload = {
  actorRoleId?: number;
  permissionIds?: number[];
  permissions?: string[];
  addPermissions?: string[];
};

export default async function guardSensitivePermissions(
  repositories: Repositories,
  payload: SensitivePermissionPayload,
) {
  if (payload.actorRoleId === 1) return;

  const requestedNames = [...(payload.permissions ?? []), ...(payload.addPermissions ?? [])];
  const hasSensitiveByName = requestedNames.some((name) => SENSITIVE_PERMISSIONS.includes(name));

  let hasSensitiveById = false;
  if (payload.permissionIds?.length) {
    const permissions = await repositories.permissionRepository.findAll({
      ids: payload.permissionIds,
      columns: ['id', 'name'],
      limit: -1,
    });
    hasSensitiveById = permissions.some((permission) =>
      SENSITIVE_PERMISSIONS.includes(permission.name),
    );
  }

  if (hasSensitiveByName || hasSensitiveById)
    throw new ErrorForbidden(
      'Hanya Developer yang dapat mengelola permission Show/Manage Permission.',
    );
}
