import { OrderRelation } from '@/domain/entities/enums/order.enum';
import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { ORDER_FIELD, ORDER_FIELDS } from '@/domain/entities/models/order';
import { USER_SELECT_FIELDS_PRISMA } from '@/domain/entities/models/user';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import { OrderInclude } from '@/infrastructure/database/prisma/generated/models';
import { FindAllOrderDto, FindByIdOrderDto } from '@/validations/order-validation';

export default class QueryOrderRepository {
  handleInclude(relation: FindAllOrderDto['with'] & FindByIdOrderDto['with']) {
    const include: OrderInclude = {};

    if (relation?.includes(OrderRelation.CUSTOMER))
      include.customer = { select: USER_SELECT_FIELDS_PRISMA };
    if (relation?.includes(OrderRelation.CUSTOMER_PROFILE))
      include.customer = { select: { ...USER_SELECT_FIELDS_PRISMA, profile: true } };
    if (relation?.includes(OrderRelation.USER))
      include.user = { select: USER_SELECT_FIELDS_PRISMA };
    if (relation?.includes(OrderRelation.USER_PROFILE))
      include.user = { select: { ...USER_SELECT_FIELDS_PRISMA, profile: true } };
    if (relation?.includes(OrderRelation.ORDER_ITEMS)) include.orderItems = true;
    if (relation?.includes(OrderRelation.ORDER_ITEMS_PRODUCT))
      include.orderItems = { include: { product: true } };
    if (relation?.includes(OrderRelation.PAYMENT)) include.payment = true;

    return Object.keys(include).length ? include : undefined;
  }

  handleWhere(
    params: Omit<Partial<FindAllOrderDto & FindByIdOrderDto>, 'columns' | 'with' | 'orderBy'>,
  ) {
    const where: Prisma.OrderWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.notId)
      where.id = Array.isArray(params.notId) ? { notIn: params.notId } : { not: params.notId };
    if (params.status)
      where.status = Array.isArray(params.status) ? { in: params.status } : params.status;
    if (params.orderNumber)
      where.orderNumber = Array.isArray(params.orderNumber)
        ? { in: params.orderNumber }
        : params.orderNumber;
    if (params.paymentMethod)
      where.payment = {
        method: Array.isArray(params.paymentMethod)
          ? { in: params.paymentMethod as PaymentMethod[] }
          : params.paymentMethod,
      };
    if (params.customerId)
      where.customerId = Array.isArray(params.customerId)
        ? { in: params.customerId }
        : params.customerId;
    if (params.userId)
      where.userId = Array.isArray(params.userId) ? { in: params.userId } : params.userId;
    if (params.createdAtDay) {
      const start = params.createdAtDay.setHours(0, 0, 0, 0);
      const end = params.createdAtDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: new Date(start), lte: new Date(end) };
    }
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { username: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  handleOrderBy(params: Pick<FindAllOrderDto, 'orderBy'>) {
    if (!params.orderBy) return [{ createdAt: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: ORDER_FIELD[] = ORDER_FIELDS) {
    const select: Prisma.OrderSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    select._count = { select: { orderItems: true } };

    return select;
  }
}
