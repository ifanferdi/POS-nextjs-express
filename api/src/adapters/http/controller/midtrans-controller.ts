import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import MidtransRepository from '@/repositories/midtrans/midtrans-repository';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import BaseController from './_base-controller';

const midtrans = new MidtransRepository();

export default class MidtransController extends BaseController {
  webhook = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as MidtransWebhookPayload & { status_code: string };

    if (!midtrans.verifySignature(payload)) {
      res.status(401).json({ message: 'Invalid signature' });
      return;
    }
    await this.useCases.midtransUseCase.syncMidtransToDatabase.execute({
      orderNumber: payload.order_id,
      notification: payload,
    });

    res.sendStatus(200);
  });

  status = asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    const payment = await this.useCases.paymentUseCase.findByIdPayment.execute({ id: orderId });
    if (!payment.reference) {
      res.sendStatus(404);
      return;
    }

    const order = await this.useCases.midtransUseCase.syncMidtransToDatabase.execute({
      orderNumber: payment.reference,
    });

    res.json(order);
  });
}
