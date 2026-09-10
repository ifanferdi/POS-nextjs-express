import BaseController from '@/adapters/http/controller/_base-controller';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import {
  FindAllPaymentDto,
  FindAllPaymentSchema,
  FindByIdPaymentDto,
  FindByIdPaymentSchema,
} from '@/validations/payment-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class PaymentController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllPaymentDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      orderId: handleNumberOrArrayRequest(request.orderId),
      status: request.status,
      method: request.method,
    };

    FindAllPaymentSchema.parse(params);

    const result = await this.useCases.paymentUseCase.findAllPayment.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdPaymentDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };

    FindByIdPaymentSchema.parse(params);

    const result = await this.useCases.paymentUseCase.findByIdPayment.execute(params);

    res.send(result);
  });

  findOneByOrderId = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdPaymentDto = {
      id: Number(req.params.orderId),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };

    FindByIdPaymentSchema.parse(params);

    const result = await this.useCases.paymentUseCase.findByOrderId.execute(params);

    res.send(result);
  });
}
