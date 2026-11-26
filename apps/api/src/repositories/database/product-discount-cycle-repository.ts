import { Repository } from '@/domain/repositories/database.interface';
import { isOverlapping } from '@/helpers/discount.helper';
import { Prisma, ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import QueryProductDiscountCycleRepository from '@/repositories/database/queries/query-product-discount-cycle-repository';
import {
  CreateProductDiscountCycleDto,
  FindAllProductDiscountCycleDto,
  FindByIdProductDiscountCycleDto,
  UpdateProductDiscountCycleDto,
} from '@/validations/product-discount-cycle-validation';

export default class ProductDiscountCycleRepository
  extends DatabaseBaseRepository
  implements
    Repository<
      FindAllProductDiscountCycleDto,
      FindByIdProductDiscountCycleDto,
      CreateProductDiscountCycleDto,
      UpdateProductDiscountCycleDto
    >
{
  private queryProductDiscountCycleRepository = new QueryProductDiscountCycleRepository();

  async findAll<T = ProductDiscountCycle>(params: Partial<FindAllProductDiscountCycleDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.ProductDiscountCycleFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryProductDiscountCycleRepository.handleWhere(params),
      orderBy: this.queryProductDiscountCycleRepository.handleOrderBy(params),
      select: {
        ...this.queryProductDiscountCycleRepository.handleSelect(params?.columns),
        ...this.queryProductDiscountCycleRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.productDiscountCycle.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllProductDiscountCycleDto>) {
    return this.prisma.productDiscountCycle.count({
      where: this.queryProductDiscountCycleRepository.handleWhere(params),
    });
  }

  async findOne<T = ProductDiscountCycle>(params: FindByIdProductDiscountCycleDto) {
    return this.prisma.productDiscountCycle.findFirst({
      where: this.queryProductDiscountCycleRepository.handleWhere(params),
      select: {
        ...this.queryProductDiscountCycleRepository.handleSelect(params?.columns),
        ...this.queryProductDiscountCycleRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  findActive(productIds: number[], at: Date) {
    return this.prisma.productDiscountCycle.findMany({
      where: { productId: { in: productIds }, startDate: { lte: at }, endDate: { gte: at } },
      orderBy: { startDate: 'desc' },
    });
  }

  async existsOverlap(
    productId: number,
    startDate: Date,
    endDate: Date,
    notId?: number,
  ): Promise<boolean> {
    const cycles = await this.prisma.productDiscountCycle.findMany({
      where: { productId, ...(notId ? { id: { not: notId } } : {}) },
      select: { startDate: true, endDate: true },
    });

    return cycles.some((cycle) =>
      isOverlapping(startDate, endDate, cycle.startDate, cycle.endDate),
    );
  }

  store<T = ProductDiscountCycle>(data: CreateProductDiscountCycleDto) {
    return this.prisma.productDiscountCycle.create({ data }).finally() as Promise<T>;
  }

  update<T = ProductDiscountCycle>(data: UpdateProductDiscountCycleDto) {
    const { id, ...updateData } = data;
    return this.prisma.productDiscountCycle
      .update({ where: { id }, data: updateData })
      .finally() as Promise<T>;
  }

  destroy<T = BatchPayload | ProductDiscountCycle>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.productDiscountCycle.deleteMany({
        where: { id: { in: id } },
      }) as Promise<T>;
    return this.prisma.productDiscountCycle.delete({ where: { id } }).finally() as Promise<T>;
  }
}
