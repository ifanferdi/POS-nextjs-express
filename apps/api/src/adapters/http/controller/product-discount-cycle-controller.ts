import BaseController from '@/adapters/http/controller/_base-controller';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  CheckQuotaProductDiscountCycleDto,
  CheckQuotaProductDiscountCycleSchema,
  CreateProductDiscountCycleDto,
  CreateProductDiscountCycleSchema,
  FindAllProductDiscountCycleDto,
  FindAllProductDiscountCycleSchema,
  FindByIdProductDiscountCycleDto,
  FindByIdProductDiscountCycleSchema,
  UpdateProductDiscountCycleDto,
  UpdateProductDiscountCycleSchema,
} from '@/validations/product-discount-cycle-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class ProductDiscountCycleController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllProductDiscountCycleDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      productId: handleNumberOrArrayRequest(request.productId),
      from: request.from ? new Date(request.from) : undefined,
      to: request.to ? new Date(request.to) : undefined,
      with: request.with,
    };

    FindAllProductDiscountCycleSchema.parse(params);

    const result =
      await this.useCases.productDiscountCycleUseCase.findAllProductDiscountCycle.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdProductDiscountCycleDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };

    FindByIdProductDiscountCycleSchema.parse(params);

    const result =
      await this.useCases.productDiscountCycleUseCase.findByIdProductDiscountCycle.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreateProductDiscountCycleDto = {
      productId: req.body.productId,
      amount: req.body.amount,
      quota: req.body.quota,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    };

    CreateProductDiscountCycleSchema.parse(payload);

    const discount =
      await this.useCases.productDiscountCycleUseCase.createProductDiscountCycle.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', discount });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: UpdateProductDiscountCycleDto = {
      id: Number(req.params.id),
      productId: req.body.productId,
      amount: req.body.amount,
      quota: req.body.quota,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    };

    UpdateProductDiscountCycleSchema.parse(payload);

    const discount =
      await this.useCases.productDiscountCycleUseCase.updateProductDiscountCycle.execute(payload);

    res.send({ message: 'Success.', discount });
  });

  checkQuota = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CheckQuotaProductDiscountCycleDto = CheckQuotaProductDiscountCycleSchema.parse(
      req.body,
    );

    const result =
      await this.useCases.productDiscountCycleUseCase.checkQuotaProductDiscountCycle.execute(
        payload,
      );

    // Body 400 sengaja array telanjang (bukan envelope { message } error handler global).
    if (!result.valid) {
      res.status(HttpStatusCode.BAD_REQUEST).json(result.invalid);
      return;
    }

    res.send(result);
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.productDiscountCycleUseCase.deleteProductDiscountCycle.execute(
      params as BaseFindById,
    );

    res.send({ message: 'Success.' });
  });
}
