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
  private order = this.useCases.orderUseCase;

  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    let params: FindAllOrderDto = {
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

    params = await this.order.authorizationOrder.all(params, req.user.id);

    FindAllOrderSchema.parse(params);

    const result = await this.order.findAllOrder.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const params: FindByIdOrderDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
      columns: req.query.columns as any,
    };

    FindByIdOrderSchema.parse(params);

    const result = await this.order.findByIdOrder.execute(params);

    // Fix IDOR: kasir hanya boleh membaca order miliknya sendiri.
    await this.order.authorizationOrder.canAccessOrder(result?.userId, req.user.id);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const payload: CreateOrderDto = {
      userId: req.user?.id,
      idempotencyKey: String(req.headers['idempotency-key'] ?? ''),
      notes: req.body.notes,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      amount: req.body.amount,
    };

    CreateOrderSchema.parse(payload);

    const result = await this.order.createOrder.execute(payload);

    res.status(result.isIdempoten ? HttpStatusCode.OK : HttpStatusCode.CREATED).send(result.data);
  });

  updateStatus = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const payload: UpdateOrderStatusDto = {
      id: Number(req.params.id),
      status: req.body.status,
    };

    UpdateOrderStatusSchema.parse(payload);

    // Fix IDOR: periksa kepemilikan sebelum mengubah status.
    const target = await this.order.findByIdOrder.execute({
      id: payload.id,
      columns: ['userId'],
    });
    await this.order.authorizationOrder.canAccessOrder(target?.userId, req.user.id);

    const order = await this.order.updateOrderStatus.execute(payload);

    res.send({ message: 'Success.', order });
  });

  cancel = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    // Fix IDOR: periksa kepemilikan sebelum membatalkan.
    const target = await this.order.findByIdOrder.execute({ id: params.id, columns: ['userId'] });
    await this.order.authorizationOrder.canAccessOrder(target?.userId, req.user.id);

    await this.order.cancelOrder.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });
}
