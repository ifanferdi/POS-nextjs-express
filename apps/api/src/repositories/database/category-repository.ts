import { Repository } from '@/domain/repositories/database.interface';
import { Category, Prisma } from '@/infrastructure/database/prisma/generated/client';
import { BatchPayload } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import QueryCategoryRepository from '@/repositories/database/queries/query-category-repository';
import {
  CreateCategoryDto,
  FindAllCategoryDto,
  FindByIdCategoryDto,
  UpdateCategoryDto,
} from '@/validations/category-validation';

export default class CategoryRepository
  extends DatabaseBaseRepository
  implements
    Repository<FindAllCategoryDto, FindByIdCategoryDto, CreateCategoryDto, UpdateCategoryDto>
{
  private queryCategoryRepository = new QueryCategoryRepository();

  async findAll<T = Category>(params: Partial<FindAllCategoryDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.CategoryFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryCategoryRepository.handleWhere(params),
      orderBy: this.queryCategoryRepository.handleOrderBy(params),
      select: {
        ...this.queryCategoryRepository.handleSelect(params?.columns),
        ...this.queryCategoryRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.category.findMany(query) as Promise<T[]>;
  }

  count(params: Partial<FindAllCategoryDto>) {
    return this.prisma.category.count({
      where: this.queryCategoryRepository.handleWhere(params),
    });
  }

  async findOne<T = Category>(params: FindByIdCategoryDto) {
    return this.prisma.category.findFirst({
      where: this.queryCategoryRepository.handleWhere(params),
      select: {
        ...this.queryCategoryRepository.handleSelect(params?.columns),
        ...this.queryCategoryRepository.handleInclude(params?.with),
      },
    }) as Promise<T | null>;
  }

  store<T = Category>(data: CreateCategoryDto) {
    return this.prisma.category.create({ data }).finally() as Promise<T>;
  }

  update<T = Category>(data: UpdateCategoryDto) {
    const { id, ...updateData } = data;
    return this.prisma.category
      .update({ where: { id }, data: updateData })
      .finally() as Promise<T>;
  }

  destroy<T = BatchPayload | Category>(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.category.deleteMany({ where: { id: { in: id } } }) as Promise<T>;
    return this.prisma.category.delete({ where: { id } }).finally() as Promise<T>;
  }
}
