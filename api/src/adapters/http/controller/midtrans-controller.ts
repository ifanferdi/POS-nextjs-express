import config from '@/config/config';
import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import MidtransRepository from '@/repositories/midtrans/midtrans-repository';
import { MockMidtransWebhook } from '@/validations/midtrans.validation';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import moment from 'moment';
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

  // ponytail: dev-only, marks an order as settled without real Midtrans. Guarded by env.
  mock = asyncHandler(async (req: Request, res: Response) => {
    if (config.app.env === 'production') {
      res.sendStatus(404);
      return;
    }

    MockMidtransWebhook.parse(req.body);

    const orderNumber = String(req.body.orderNumber);
    const order = await this.useCases.midtransUseCase.syncMidtransToDatabase.execute(
      {
        orderNumber,
        notification: {
          order_id: orderNumber,
          transaction_id: crypto.randomUUID(),
          transaction_time: moment().format('MMMM-YY-DD HH:MM:ss'),
          transaction_status: 'settlement',
          settlement_time: moment().format('MMMM-YY-DD HH:MM:ss'),
          fraud_status: 'accept',
          status_code: '200',
          status_message: 'midtrans mock payment notification',
          payment_type:
            req.body.paymentType === PaymentMethod.QRIS
              ? 'qris'
              : req.body.paymentType === PaymentMethod.VA_MANDIRI
                ? 'echannel'
                : 'bank_transfer',
          merchant_id: 'mock',
          gross_amount: String(req.body.grossAmount),
          currency: 'IDR',
          signature_key: 'mock',
          customer_details: {},
        },
      },
      true,
    );

    res.json(order);
  });
}
