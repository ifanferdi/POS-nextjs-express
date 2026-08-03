import e from 'express';
import asyncHandler from 'express-async-handler';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { handleOrderByRequest } from '../../../helpers/common.helper';
import { BaseFindById } from '../../../validations/base-validation';
import {
  CreateCategoryDto,
  CreateCategorySchema,
  FindAllCategoryDto,
  FindAllCategorySchema,
  FindByIdCategoryDto,
  FindByIdCategorySchema,
  UpdateCategoryDto,
  UpdateCategorySchema,
} from '../../../validations/category-validation';
import BaseController from './_base-controller';

export default class CategoryController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllCategoryDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      with: request.with,
    };

    FindAllCategorySchema.parse(params);

    const result = await this.useCases.categoryUseCase.findAllCategory.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdCategoryDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
    };

    FindByIdCategorySchema.parse(params);

    const result = await this.useCases.categoryUseCase.findByIdCategory.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreateCategoryDto = {
      name: req.body.name,
      description: req.body.description,
    };

    CreateCategorySchema.parse(payload);

    const category = await this.useCases.categoryUseCase.createCategory.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', category });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: UpdateCategoryDto = {
      id: Number(req.params.id),
      name: req.body.name,
      description: req.body.description,
    };

    UpdateCategorySchema.parse(payload);

    const category = await this.useCases.categoryUseCase.updateCategory.execute(payload);

    res.send({ message: 'Success.', category });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.categoryUseCase.deleteCategory.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });
}