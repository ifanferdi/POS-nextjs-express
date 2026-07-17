import e from 'express';
import asyncHandler from 'express-async-handler';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '../../../helpers/common.helper';
import {
  CreatePaymentDto,
  CreatePaymentSchema,
  FindAllPaymentDto,
  FindAllPaymentSchema,
  FindByIdPaymentDto,
  FindByIdPaymentSchema,
} from '../../../validations/payment-validation';
import BaseController from './_base-controller';

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
    const params: FindByIdPaymentDto = { id: Number(req.params.id) };

    FindByIdPaymentSchema.parse(params);

    const result = await this.useCases.paymentUseCase.findByIdPayment.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreatePaymentDto = {
      orderId: req.body.orderId,
      amount: req.body.amount,
      method: req.body.method,
      reference: req.body.reference,
    };

    CreatePaymentSchema.parse(payload);

    const payment = await this.useCases.paymentUseCase.createPayment.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', payment });
  });
}
