import { OrderRelation } from '../../../domain/entities/enums/order.enum';
import { ORDER_FIELD, ORDER_FIELDS } from '../../../domain/entities/models/order';
import { Prisma } from '../../../infrastructure/database/prisma/generated/client';
import { FindAllOrderDto, FindByIdOrderDto } from '../../../validations/order-validation';

export default class QueryOrderRepository {
  handleInclude(relation: FindAllOrderDto['with'] & FindByIdOrderDto['with']) {
    const include: Record<string, any> = {};

    if (relation?.includes(OrderRelation.CUSTOMER))
      include.customer = { select: { id: true, username: true, email: true, profile: true } };
    if (relation?.includes(OrderRelation.USER))
      include.user = { select: { id: true, username: true, profile: true } };
    if (relation?.includes(OrderRelation.ORDER_ITEMS))
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
    if (params.paymentMethod)
      where.paymentMethod = Array.isArray(params.paymentMethod)
        ? { in: params.paymentMethod }
        : params.paymentMethod;
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

    return select;
  }
}
