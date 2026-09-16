import { UserRelation } from '@/domain/entities/enums/user.enum';
import { ROLE_FIELDS_PRISMA } from '@/domain/entities/models/role';
import { USER_FIELD, USER_SELECT_FIELDS } from '@/domain/entities/models/user';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { UserInclude } from '@/infrastructure/database/prisma/generated/models';
import { FindAllUserDto, FindOneUserDto } from '@/validations/user-validation';

export default class QueryUserRepository {
  handleInclude(relation: FindAllUserDto['with'] & FindOneUserDto['with']) {
    const include: UserInclude = {};

    if (relation?.includes(UserRelation.PROFILE)) include.profile = true;
    if (relation?.includes(UserRelation.ROLE)) include.role = true;
    if (
      relation?.includes(UserRelation.ROLE_PERMISSIONS) ||
      relation?.includes(UserRelation.PERMISSIONS)
    )
      include.role = {
        select: {
          ...ROLE_FIELDS_PRISMA,
          roleHasPermissions: {
            select: { permission: true },
            orderBy: {
              /** permissionId: 'asc' **/
              permission: { name: 'asc' },
            },
          },
        },
      };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(params: Omit<Partial<FindAllUserDto & FindOneUserDto>, 'columns' | 'orderBy'>) {
    const where: Prisma.UserWhereInput = {};

    if (!params.with?.includes(UserRelation.SOFT_DELETE)) where.deletedAt = null;
    if (params.id) where.id = params.id;
    if (params.ids?.length && params.ids.length > 0) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.roleId)
      where.roleId = Array.isArray(params.roleId) ? { in: params.roleId } : params.roleId;
    if (params.username)
      where.username = Array.isArray(params.username) ? { in: params.username } : params.username;
    if (params.email)
      where.email = Array.isArray(params.email) ? { in: params.email } : params.email;
    if (params.role)
      where.role = {
        name: Array.isArray(params.role)
          ? { in: params.role, mode: 'insensitive' }
          : { contains: params.role, mode: 'insensitive' },
      };

    if (params.search) {
      where.profile = {
        OR: [{ fullName: { contains: params.search, mode: 'insensitive' } }],
      };
    }

    return where;
  }

  handleOrderBy(params: Pick<FindAllUserDto, 'orderBy'>) {
    if (!params.orderBy) return [{ updatedAt: 'desc' }] as Record<USER_FIELD, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => {
      return { [field]: direction ?? 'asc' };
    }) as Record<USER_FIELD, 'asc' | 'desc'>[];
  }

  handleSelect(cols: USER_FIELD[] = USER_SELECT_FIELDS) {
    const select: Prisma.UserSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => (select[c] = true));

    return select;
  }
}
