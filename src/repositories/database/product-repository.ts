import _ from 'lodash';
import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  CreateProductDto,
  FindAllProductDto,
  FindByIdProductDto,
  UpdateProductDto,
} from '../../validations/product-validation';
import DatabaseBaseRepository from './_database-base-repository';
import QueryProductRepository from './queries/query-product-repository';

export default class ProductRepository
  extends DatabaseBaseRepository
  implements Repository<FindAllProductDto, FindByIdProductDto, CreateProductDto, UpdateProductDto>
{
  private queryProductRepository = new QueryProductRepository();

  async findAll(params: Partial<FindAllProductDto>) {
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

    return this.prisma.product.findMany(query);
  }

  count(params: Partial<FindAllProductDto>) {
    return this.prisma.product.count({
      where: this.queryProductRepository.handleWhere(params),
    });
  }

  async findOne(params: FindByIdProductDto) {
    return this.prisma.product.findFirst({
      where: this.queryProductRepository.handleWhere(params),
      select: {
        ...this.queryProductRepository.handleSelect(params?.columns),
        ...this.queryProductRepository.handleInclude(params?.with),
      },
    });
  }

  store(data: CreateProductDto) {
    const { categoryIds, ...productData } = data;

    return this.prisma.product.create({
      data: {
        ...productData,
        productHasCategories:
          categoryIds && categoryIds.length > 0
            ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
      },
      include: { productHasCategories: { include: { category: true } } },
    });
  }

  update(data: UpdateProductDto) {
    const { id, categoryIds, ...productData } = data;

    if (categoryIds !== undefined) {
      return this.prisma.$transaction(async (tx) => {
        await tx.productHasCategory.deleteMany({ where: { productId: id } });
        if (categoryIds.length > 0)
          await tx.productHasCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
          });

        return tx.product.update({
          where: { id },
          data: productData,
          include: { productHasCategories: { include: { category: true } } },
        });
      });
    }

    return this.prisma.product.update({ where: { id }, data: productData });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.product.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: new Date(), isActive: false },
      });
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  restore(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.product.updateMany({
        where: { id: { in: id } },
        data: { deletedAt: null },
      });
    return this.prisma.product.update({ where: { id }, data: { deletedAt: null } });
  }

  deletePermanently(id: number | number[]) {
    if (id instanceof Array) return this.prisma.product.deleteMany({ where: { id: { in: id } } });
    return this.prisma.product.deleteMany({ where: { id } });
  }
}
