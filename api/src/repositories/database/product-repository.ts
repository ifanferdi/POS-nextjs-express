import { ProductCategories } from '@/domain/entities/models/product';
import { Repository } from '@/domain/repositories/database.interface';
import { Prisma, Product, Role } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import {
  ProductCreateInput,
  ProductInclude,
} from '@/infrastructure/database/prisma/generated/models';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import QueryProductRepository from '@/repositories/database/queries/query-product-repository';
import {
  CreateProductDto,
  FindAllProductDto,
  FindByIdProductDto,
  UpdateProductDto,
} from '@/validations/product-validation';

export default class ProductRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllProductDto, FindByIdProductDto, CreateProductDto, UpdateProductDto>
{
  private queryProductRepository = new QueryProductRepository();

  async findAll<T = Product>(params: Partial<FindAllProductDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.ProductFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryProductRepository.handleWhere(params),
      orderBy: this.queryProductRepository.handleOrderBy(params),
      select: {
        ...this.queryProductRepository.handleSelect(params?.columns),
        ...this.queryProductRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.product.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllProductDto>) {
    return this.prisma.product.count({
      where: this.queryProductRepository.handleWhere(params),
    });
  }

  async findOne<T = Product>(params: FindByIdProductDto) {
    return this.prisma.product.findFirst({
      where: this.queryProductRepository.handleWhere(params),
      select: {
        ...this.queryProductRepository.handleSelect(params?.columns),
        ...this.queryProductRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  store<T = Product>(data: CreateProductDto) {
    const { categoryIds, ...productData } = data;
    const payload: ProductCreateInput = productData;
    const include: ProductInclude = {};

    if (categoryIds) {
      payload.productHasCategories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
      include.productHasCategories = { include: { category: true } };
    }

    return this.prisma.product.create({ data: payload, include }).finally() as Promise<T>;
  }

  update<T = Product | ProductCategories>(data: UpdateProductDto) {
    const { id, categoryIds, ...productData } = data;

    if (categoryIds) {
      return this.prisma.$transaction(async (tx) => {
        await tx.productHasCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length > 0)
          await tx.productHasCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
          });

        return tx.product
          .update({
            where: { id },
            data: productData,
            include: { productHasCategories: { include: { category: true } } },
          })
          .finally() as Promise<T>;
      });
    }

    return this.prisma.product.update({ where: { id }, data: productData }).finally() as Promise<T>;
  }

  destroy<T = BatchPayload | Product>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.product.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: new Date() },
      }) as Promise<T>;

    return this.prisma.product
      .update({
        where: { id },
        data: { deletedAt: new Date() },
      })
      .finally() as Promise<T>;
  }

  restore<T = BatchPayload | Product>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.product.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: null },
      }) as Promise<T>;

    return this.prisma.product
      .update({ where: { id }, data: { deletedAt: null } })
      .finally() as Promise<T>;
  }

  deletePermanently<T = BatchPayload | Role>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.product.deleteMany({ where: { id: { in: id } } }) as Promise<T>;
    return this.prisma.product.delete({ where: { id } }).finally() as Promise<T>;
  }
}
