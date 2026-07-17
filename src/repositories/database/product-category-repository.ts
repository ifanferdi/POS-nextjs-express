import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  CreateProductCategoryDto,
  FindAllProductCategoryDto,
  FindByIdProductCategoryDto,
  UpdateProductCategoryDto,
} from '../../validations/product-category-validation';
import DatabaseBaseRepository from './_database-base-repository';
import QueryProductCategoryRepository from './queries/query-product-category-repository';

export default class ProductCategoryRepository
  extends DatabaseBaseRepository
  implements
    Repository<
      FindAllProductCategoryDto,
      FindByIdProductCategoryDto,
      CreateProductCategoryDto,
      UpdateProductCategoryDto
    >
{
  private queryProductCategoryRepository = new QueryProductCategoryRepository();

  async findAll(params: Partial<FindAllProductCategoryDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.ProductCategoryFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryProductCategoryRepository.handleWhere(params),
      orderBy: this.queryProductCategoryRepository.handleOrderBy(params),
      select: {
        ...this.queryProductCategoryRepository.handleSelect(params?.columns),
        ...this.queryProductCategoryRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.productCategory.findMany(query);
  }

  count(params: Partial<FindAllProductCategoryDto>) {
    return this.prisma.productCategory.count({
      where: this.queryProductCategoryRepository.handleWhere(params),
    });
  }

  async findOne(params: FindByIdProductCategoryDto) {
    return this.prisma.productCategory.findFirst({
      where: this.queryProductCategoryRepository.handleWhere(params),
      select: {
        ...this.queryProductCategoryRepository.handleSelect(params?.columns),
        ...this.queryProductCategoryRepository.handleInclude(params?.with),
      },
    });
  }

  store(data: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({ data });
  }

  update(data: UpdateProductCategoryDto) {
    const { id, ...updateData } = data;
    return this.prisma.productCategory.update({ where: { id }, data: updateData });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.productCategory.deleteMany({ where: { id: { in: id } } });
    return this.prisma.productCategory.delete({ where: { id } });
  }
}
