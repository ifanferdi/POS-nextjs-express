import { RoleRelation } from '../../../domain/entities/enums/role.enum';
import { ROLE_FIELD, ROLE_FIELDS } from '../../../domain/entities/models/role';
import { USER_SELECT_FIELDS_PRISMA } from '../../../domain/entities/models/user';
import { Prisma } from '../../../infrastructure/database/prisma/generated/client';
import { FindAllRoleDto, FindByIdRoleDto } from '../../../validations/role-validation';

export default class QueryRoleRepository {
  handleInclude(relation?: FindAllRoleDto['with'] | FindByIdRoleDto['with']) {
    const include: Record<string, any> = {};

    if (relation?.includes(RoleRelation.USERS))
      include.users = { select: USER_SELECT_FIELDS_PRISMA };
    if (relation?.includes(RoleRelation.PERMISSIONS))
      include.roleHasPermissions = { select: { permission: true } };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<Partial<FindAllRoleDto & FindByIdRoleDto>, 'columns' | 'with' | 'orderBy'>,
  ) {
    const where: Prisma.RoleWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length && params.ids.length > 0) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.name) where.name = Array.isArray(params.name) ? { in: params.name } : params.name;
    if (params.userId)
      where.users = {
        some: { id: Array.isArray(params.userId) ? { in: params.userId } : params.userId },
      };
    if (params.permissionId)
      where.roleHasPermissions = {
        some: {
          permissionId: Array.isArray(params.permissionId)
            ? { in: params.permissionId }
            : params.permissionId,
        },
      };

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    return where;
  }

  handleOrderBy(params: Pick<FindAllRoleDto, 'orderBy'>) {
    if (!params.orderBy) return [{ updatedAt: 'desc' }] as Record<ROLE_FIELD, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => {
      return { [field]: direction ?? 'asc' };
    }) as Record<ROLE_FIELD, 'asc' | 'desc'>[];
  }

  handleSelect(cols: ROLE_FIELD[] = ROLE_FIELDS) {
    const select: Prisma.RoleSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => (select[c] = true));

    return select;
  }
}
