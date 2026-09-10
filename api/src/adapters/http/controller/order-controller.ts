import BaseController from '@/adapters/http/controller/_base-controller';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  CreateOrderDto,
  CreateOrderSchema,
  FindAllOrderDto,
  FindAllOrderSchema,
  FindByIdOrderDto,
  FindByIdOrderSchema,
  UpdateOrderStatusDto,
  UpdateOrderStatusSchema,
} from '@/validations/order-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class OrderController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllOrderDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      status: request.status,
      paymentMethod: request.paymentMethod,
      customerId: handleNumberOrArrayRequest(request.customerId),
      userId: handleNumberOrArrayRequest(request.userId),
      with: request.with,
      createdAtDay: request.createdAtDay,
    };

    FindAllOrderSchema.parse(params);

    const result = await this.useCases.orderUseCase.findAllOrder.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdOrderDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };

    FindByIdOrderSchema.parse(params);

    const result = await this.useCases.orderUseCase.findByIdOrder.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const payload: CreateOrderDto = {
      userId: req.user?.id,
      notes: req.body.notes,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      paymentReference: req.body.paymentReference,
      amount: req.body.amount,
    };

    CreateOrderSchema.parse(payload);

    const order = await this.useCases.orderUseCase.createOrder.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', order });
  });

  updateStatus = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: UpdateOrderStatusDto = {
      id: Number(req.params.id),
      status: req.body.status,
    };

    UpdateOrderStatusSchema.parse(payload);

    const order = await this.useCases.orderUseCase.updateOrderStatus.execute(payload);

    res.send({ message: 'Success.', order });
  });

  cancel = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.orderUseCase.cancelOrder.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });
}
