import e from 'express';
import asyncHandler from 'express-async-handler';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { handleOrderByRequest } from '../../../helpers/common.helper';
import { BaseFindById } from '../../../validations/base-validation';
import {
  CreateProductCategoryDto,
  CreateProductCategorySchema,
  FindAllProductCategoryDto,
  FindAllProductCategorySchema,
  FindByIdProductCategoryDto,
  FindByIdProductCategorySchema,
  UpdateProductCategoryDto,
  UpdateProductCategorySchema,
} from '../../../validations/product-category-validation';
import BaseController from './_base-controller';

export default class ProductCategoryController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllProductCategoryDto = {
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

    FindAllProductCategorySchema.parse(params);

    const result =
      await this.useCases.productCategoryUseCase.findAllProductCategory.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdProductCategoryDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
    };

    FindByIdProductCategorySchema.parse(params);

    const result =
      await this.useCases.productCategoryUseCase.findByIdProductCategory.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreateProductCategoryDto = {
      name: req.body.name,
      description: req.body.description,
    };

    CreateProductCategorySchema.parse(payload);

    const category =
      await this.useCases.productCategoryUseCase.createProductCategory.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', category });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: UpdateProductCategoryDto = {
      id: Number(req.params.id),
      name: req.body.name,
      description: req.body.description,
    };

    UpdateProductCategorySchema.parse(payload);

    const category =
      await this.useCases.productCategoryUseCase.updateProductCategory.execute(payload);

    res.send({ message: 'Success.', category });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.productCategoryUseCase.deleteProductCategory.execute(
      params as BaseFindById,
    );

    res.send({ message: 'Success.' });
  });
}
