import config from '@/config/config';
import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import { createMidtransSignatureKey } from '@/helpers/common.helper';
import MidtransRepository from '@/repositories/midtrans/midtrans-repository';
import { MockMidtransSchema } from '@/validations/midtrans.validation';
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

  // Dev-only: crafts a signed Midtrans notification and runs it through the real production sync
  // path (signature verified, no isMock bypass). Guarded by env (404 in production).
  mock = asyncHandler(async (req: Request, res: Response) => {
    if (config.app.env === 'production') {
      res.sendStatus(404);
      return;
    }

    const body = MockMidtransSchema.parse(req.body);
    const grossAmount = String(body.grossAmount);
    const statusCode = '200';

    const signatureKey = createMidtransSignatureKey(
      `${body.orderNumber}${statusCode}${grossAmount}${config.midtrans.serverKey}`,
    );

    const notification: MidtransWebhookPayload = {
      order_id: body.orderNumber,
      transaction_id: `mock-${body.orderNumber}`,
      transaction_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      transaction_status: body.transactionStatus,
      fraud_status: 'accept',
      status_code: statusCode,
      status_message: 'midtrans mock notification',
      payment_type: 'qris',
      merchant_id: 'mock',
      gross_amount: grossAmount,
      currency: 'IDR',
      signature_key: signatureKey,
      customer_details: {},
    };

    const order = await this.useCases.midtransUseCase.syncMidtransToDatabase.execute({
      orderNumber: body.orderNumber,
      notification,
    });

    res.json(order ?? { message: 'no operations' });
  });
}
