import { PaymentStatus } from '../../domain/entities/enums/payment.enum';
import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  CreatePaymentDto,
  FindAllPaymentDto,
  FindByIdPaymentDto,
  FindOnePaymentDto,
} from '../../validations/payment-validation';
import DatabaseBaseRepository from './_database-base-repository';
import QueryPaymentRepository from './queries/query-payment-repository';

export default class PaymentRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllPaymentDto, FindByIdPaymentDto, CreatePaymentDto, CreatePaymentDto>
{
  private queryPaymentRepository = new QueryPaymentRepository();

  async findAll(params: Partial<FindAllPaymentDto>) {
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

    return this.prisma.payment.findMany(query);
  }

  count(params: Partial<FindAllPaymentDto>) {
    return this.prisma.payment.count({
      where: this.queryPaymentRepository.handleWhere(params),
    });
  }

  async findOne(params: FindOnePaymentDto) {
    return this.prisma.payment.findFirst({
      where: this.queryPaymentRepository.handleWhere(params),
      select: { ...this.queryPaymentRepository.handleSelect() },
    });
  }

  store(data: CreatePaymentDto) {
    return this.prisma.payment.create({ data: { ...data, status: PaymentStatus.COMPLETED } });
  }

  update(data: CreatePaymentDto) {
    const { ...updateData } = data;
    return this.prisma.payment.update({
      where: { id: updateData.orderId },
      data: updateData,
    });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array) return this.prisma.payment.deleteMany({ where: { id: { in: id } } });
    return this.prisma.payment.delete({ where: { id } });
  }
}
