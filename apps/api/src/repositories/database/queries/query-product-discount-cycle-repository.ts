import { ProductDiscountCycleRelation } from '@/domain/entities/enums/product-discount-cycle.enum';
import {
  PRODUCT_DISCOUNT_CYCLE_FIELD,
  PRODUCT_DISCOUNT_CYCLE_FIELDS,
} from '@/domain/entities/models/product-discount-cycle';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { ProductDiscountCycleInclude } from '@/infrastructure/database/prisma/generated/models';
import {
  FindAllProductDiscountCycleDto,
  FindByIdProductDiscountCycleDto,
} from '@/validations/product-discount-cycle-validation';

export default class QueryProductDiscountCycleRepository {
  handleInclude(
    relation: FindAllProductDiscountCycleDto['with'] & FindByIdProductDiscountCycleDto['with'],
  ) {
    const include: ProductDiscountCycleInclude = {};

    if (relation?.includes(ProductDiscountCycleRelation.PRODUCT)) include.product = true;

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<
      Partial<FindAllProductDiscountCycleDto & FindByIdProductDiscountCycleDto>,
      'columns' | 'with' | 'orderBy'
    >,
  ) {
    const where: Prisma.ProductDiscountCycleWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.productId)
      where.productId = Array.isArray(params.productId)
        ? { in: params.productId }
        : params.productId;
    // Overlap rentang: cycle beririsan dengan [from, to].
    if (params.from) where.endDate = { gte: params.from };
    if (params.to) where.startDate = { lte: params.to };
    if (params.search) where.product = { name: { contains: params.search, mode: 'insensitive' } };

    return where;
  }

  handleOrderBy(params: Pick<FindAllProductDiscountCycleDto, 'orderBy'>) {
    if (!params.orderBy) return [{ startDate: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: PRODUCT_DISCOUNT_CYCLE_FIELD[] = PRODUCT_DISCOUNT_CYCLE_FIELDS) {
    const select: Prisma.ProductDiscountCycleSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    return select;
  }
}
