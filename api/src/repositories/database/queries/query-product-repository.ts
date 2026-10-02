import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { PRODUCT_FIELD, PRODUCT_FIELDS } from '@/domain/entities/models/product';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { ProductInclude } from '@/infrastructure/database/prisma/generated/models';
import { FindAllProductDto, FindByIdProductDto } from '@/validations/product-validation';

export default class QueryProductRepository {
  handleInclude(relation: FindAllProductDto['with'] & FindByIdProductDto['with']) {
    const include: ProductInclude = {};

    if (relation?.includes(ProductRelation.CATEGORIES))
      include.productHasCategories = { select: { category: true } };

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<Partial<FindAllProductDto & FindByIdProductDto>, 'columns' | 'orderBy'>,
  ) {
    const where: Prisma.ProductWhereInput = {};

    if (!params.with?.includes(ProductRelation.SOFT_DELETE)) where.deletedAt = null;
    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.barcode)
      where.barcode = Array.isArray(params.barcode) ? { in: params.barcode } : params.barcode;
    if (params.sku) where.sku = Array.isArray(params.sku) ? { in: params.sku } : params.sku;
    if (params.categoryId)
      where.productHasCategories = {
        some: {
          categoryId: Array.isArray(params.categoryId)
            ? { in: params.categoryId }
            : params.categoryId,
        },
      };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  handleOrderBy(params: Pick<FindAllProductDto, 'orderBy'>) {
    if (!params.orderBy) return [{ updatedAt: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: PRODUCT_FIELD[] = PRODUCT_FIELDS) {
    const select: Prisma.ProductSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    return select;
  }
}
