import { PermissionRelation } from '../../../domain/entities/enums/permission.enum';
import { PERMISSION_FIELD, PERMISSION_FIELDS } from '../../../domain/entities/models/permission';
import { Prisma } from '../../../infrastructure/database/prisma/generated/client';
import {
  FindAllPermissionDto,
  FindByIdPermissionDto,
} from '../../../validations/permission-validation';

export default class QueryPermissionRepository {
  handleInclude(params: Pick<FindAllPermissionDto | FindByIdPermissionDto, 'with'>) {
    const include: Record<string, any> = {};

    if (params?.with?.includes(PermissionRelation.ROLES))
      include.roleHasPermissions = { select: { role: true } };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<
      Partial<FindAllPermissionDto & FindByIdPermissionDto>,
      'columns' | 'with' | 'orderBy'
    >,
  ) {
    const where: Prisma.PermissionWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length && params.ids.length > 0) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.name) where.name = Array.isArray(params.name) ? { in: params.name } : params.name;
    if (params.roleId)
      where.roleHasPermissions = {
        some: { roleId: Array.isArray(params.roleId) ? { in: params.roleId } : params.roleId },
      };
    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    return where;
  }

  handleOrderBy(params: Pick<FindAllPermissionDto, 'orderBy'>) {
    if (!params.orderBy)
      return [{ updatedAt: 'desc' }] as Record<PERMISSION_FIELD, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => {
      return { [field]: direction ?? 'asc' };
    }) as Record<PERMISSION_FIELD, 'asc' | 'desc'>[];
  }

  handleSelect(cols: PERMISSION_FIELD[] = PERMISSION_FIELDS) {
    const select: Prisma.PermissionSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => (select[c] = true));

    return select;
  }
}
