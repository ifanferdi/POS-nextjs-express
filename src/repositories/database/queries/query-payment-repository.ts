import { Prisma } from '../../../infrastructure/database/prisma/generated/client';
import { PaymentScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { FindAllPaymentDto, FindByIdPaymentDto } from '../../../validations/payment-validation';

type PAYMENT_FIELD = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum];

const PAYMENT_FIELDS = Object.keys(PaymentScalarFieldEnum) as PAYMENT_FIELD[];

export default class QueryPaymentRepository {
  handleWhere(
    params: Omit<Partial<FindAllPaymentDto & FindByIdPaymentDto>, 'columns' | 'orderBy'>,
  ) {
    const where: Prisma.PaymentWhereInput = {};

    if (params.id) where.id = params.id;
    if (params.ids?.length) where.id = { in: params.ids };
    if (params.orderId)
      where.orderId = Array.isArray(params.orderId) ? { in: params.orderId } : params.orderId;
    if (params.status)
      where.status = Array.isArray(params.status) ? { in: params.status } : params.status;
    if (params.method)
      where.method = Array.isArray(params.method) ? { in: params.method } : params.method;

    return where;
  }

  handleOrderBy(params: Pick<FindAllPaymentDto, 'orderBy'>) {
    if (!params.orderBy) return [{ createdAt: 'desc' }] as Record<string, 'asc' | 'desc'>[];

    return params.orderBy.map(({ field, direction }) => ({
      [field]: direction ?? 'asc',
    })) as Record<string, 'asc' | 'desc'>[];
  }

  handleSelect(cols: PAYMENT_FIELD[] = PAYMENT_FIELDS) {
    const select: Prisma.PaymentSelect = {};

    if (cols && cols.length > 0) cols.forEach((c) => ((select as any)[c] = true));

    return select;
  }
}
