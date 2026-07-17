import { ProductCategoryRelation } from '../../../domain/entities/enums/product-category.enum';
import {
  PRODUCT_CATEGORY_FIELD,
  PRODUCT_CATEGORY_FIELDS,
} from '../../../domain/entities/models/product-category';
import { Prisma } from '../../../infrastructure/database/prisma/generated/client';
import {
  FindAllProductCategoryDto,
  FindByIdProductCategoryDto,
} from '../../../validations/product-category-validation';

export default class QueryProductCategoryRepository {
  handleInclude(relation: FindAllProductCategoryDto['with'] & FindByIdProductCategoryDto['with']) {
    const include: Record<string, any> = {};

    if (relation?.includes(ProductCategoryRelation.PRODUCTS))
      include.productHasCategories = { select: { product: true } };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<
      Partial<FindAllProductCategoryDto & FindByIdProductCategoryDto>,
      'columns' | 'with' | 'orderBy'
    >,
  ) {
    const where: Prisma.ProductCategoryWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };

    return where;
  }

  handleOrderBy(params: Pick<FindAllProductCategoryDto, 'orderBy'>) {
    if (!params.orderBy) return [{ updatedAt: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: PRODUCT_CATEGORY_FIELD[] = PRODUCT_CATEGORY_FIELDS) {
    const select: Prisma.ProductCategorySelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    return select;
  }
}
