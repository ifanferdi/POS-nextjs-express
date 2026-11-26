import BaseController from '@/adapters/http/controller/_base-controller';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { handleOrderByRequest } from '@/helpers/common.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  CreateCategorySchema,
  FindAllCategorySchema,
  FindByIdCategorySchema,
  UpdateCategorySchema,
} from '@/validations/category-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class CategoryController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params = FindAllCategorySchema.parse({
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      with: request.with,
    });

    const result = await this.useCases.categoryUseCase.findAllCategory.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = FindByIdCategorySchema.parse({
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    });

    const result = await this.useCases.categoryUseCase.findByIdCategory.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload = CreateCategorySchema.parse({
      name: req.body.name,
      description: req.body.description,
    });

    const category = await this.useCases.categoryUseCase.createCategory.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', category });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload = UpdateCategorySchema.parse({
      id: Number(req.params.id),
      name: req.body.name,
      description: req.body.description,
    });

    const category = await this.useCases.categoryUseCase.updateCategory.execute(payload);

    res.send({ message: 'Success.', category });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = BaseFindById.parse({ id: Number(req.params.id) });

    await this.useCases.categoryUseCase.deleteCategory.execute(params);

    res.send({ message: 'Success.' });
  });
}
