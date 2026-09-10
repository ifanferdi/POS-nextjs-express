import { CategoryRelation } from '@/domain/entities/enums/category.enum';
import { CATEGORY_FIELD, CATEGORY_FIELDS } from '@/domain/entities/models/category';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { FindAllCategoryDto, FindByIdCategoryDto } from '@/validations/category-validation';

export default class QueryCategoryRepository {
  handleInclude(relation: FindAllCategoryDto['with'] & FindByIdCategoryDto['with']) {
    const include: Record<string, any> = {};

    if (relation?.includes(CategoryRelation.PRODUCTS))
      include.productHasCategories = { select: { product: true } };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<Partial<FindAllCategoryDto & FindByIdCategoryDto>, 'columns' | 'with' | 'orderBy'>,
  ) {
    const where: Prisma.CategoryWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.name)
      where.name = Array.isArray(params.name)
        ? { in: params.name, mode: 'insensitive' }
        : { equals: params.name, mode: 'insensitive' };
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };

    return where;
  }

  handleOrderBy(params: Pick<FindAllCategoryDto, 'orderBy'>) {
    if (!params.orderBy) return [{ updatedAt: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: CATEGORY_FIELD[] = CATEGORY_FIELDS) {
    const select: Prisma.CategorySelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    select._count = { select: { productHasCategories: true } };

    return select;
  }
}
