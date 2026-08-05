import { Repository } from '../../domain/repositories/database.interface';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  CreateCategoryDto,
  FindAllCategoryDto,
  FindByIdCategoryDto,
  UpdateCategoryDto,
} from '../../validations/category-validation';
import DatabaseBaseRepository from './_database-base-repository';
import QueryCategoryRepository from './queries/query-category-repository';

export default class CategoryRepository
  extends DatabaseBaseRepository
  implements
    Repository<
      FindAllCategoryDto,
      FindByIdCategoryDto,
      CreateCategoryDto,
      UpdateCategoryDto
    >
{
  private queryCategoryRepository = new QueryCategoryRepository();

  async findAll(params: Partial<FindAllCategoryDto>) {
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

    return this.prisma.category.findMany(query);
  }

  count(params: Partial<FindAllCategoryDto>) {
    return this.prisma.category.count({
      where: this.queryCategoryRepository.handleWhere(params),
    });
  }

  async findOne(params: FindByIdCategoryDto) {
    return this.prisma.category.findFirst({
      where: this.queryCategoryRepository.handleWhere(params),
      select: {
        ...this.queryCategoryRepository.handleSelect(params?.columns),
        ...this.queryCategoryRepository.handleInclude(params?.with),
      },
    });
  }

  store(data: CreateCategoryDto) {
    return this.prisma.category.create({ data });
  }

  update(data: UpdateCategoryDto) {
    const { id, ...updateData } = data;
    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  destroy(id: number | number[]) {
    if (id instanceof Array)
      return this.prisma.category.deleteMany({ where: { id: { in: id } } });
    return this.prisma.category.delete({ where: { id } });
  }
}