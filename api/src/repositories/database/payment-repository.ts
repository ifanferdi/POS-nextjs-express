import { PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { Payment, Prisma } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import {
  PaymentInclude,
  PaymentUncheckedCreateInput,
  PaymentUpdateInput,
} from '@/infrastructure/database/prisma/generated/models';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import QueryPaymentRepository from '@/repositories/database/queries/query-payment-repository';
import {
  CreatePaymentDto,
  FindAllPaymentDto,
  FindOnePaymentDto,
  UpdatePaymentDto,
} from '@/validations/payment-validation';
import _ from 'lodash';

export default class PaymentRepository extends DatabaseBaseRepository {
  private queryPaymentRepository = new QueryPaymentRepository();

  async findAll<T = Payment>(params: Partial<FindAllPaymentDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.PaymentFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryPaymentRepository.handleWhere(params),
      orderBy: this.queryPaymentRepository.handleOrderBy(params),
      select: { ...this.queryPaymentRepository.handleSelect(params?.columns) },
    };

    return this.prisma.payment.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllPaymentDto>) {
    return this.prisma.payment.count({
      where: this.queryPaymentRepository.handleWhere(params),
    });
  }

  async findOne<T = Payment>(params: FindOnePaymentDto) {
    console.log(params);

    return this.prisma.payment.findFirst({
      where: this.queryPaymentRepository.handleWhere(params),
      select: {
        ...this.queryPaymentRepository.handleSelect(params?.columns),
        ...this.queryPaymentRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  store<T = Payment>(data: CreatePaymentDto) {
    if (!data.status) data.status = PaymentStatus.PENDING;
    const include: PaymentInclude = {};

    const payload: PaymentUncheckedCreateInput = _.omit(data, 'midtransDetail');
    if (data.midtransDetail) {
      payload.midtransDetail = { create: data.midtransDetail };
      include.midtransDetail = true;
    }

    return this.prisma.payment.create({ data: payload, include }).finally() as Promise<T>;
  }

  update<T = Payment>(data: UpdatePaymentDto) {
    const { orderId } = data;
    if (!data.status) data.status = PaymentStatus.PENDING;

    const updateData: PaymentUpdateInput = _.omit(data, 'midtransDetail');
    const include: PaymentInclude = {};
    if (data.midtransDetail) {
      updateData.midtransDetail = { create: data.midtransDetail };
      include.midtransDetail = true;
    }

    return this.prisma.payment
      .update({ where: { orderId }, data: updateData, include })
      .finally() as Promise<T>;
  }

  destroy<T = BatchPayload | Payment>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.payment.deleteMany({ where: { id: { in: id } } }) as Promise<T>;
    return this.prisma.payment.delete({ where: { id } }).finally() as Promise<T>;
  }
}
