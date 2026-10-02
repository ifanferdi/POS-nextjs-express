import config from '@/config/config';
import {
  MidtransChargePayload,
  MidtransChargeResponse,
  MidtransWebhookPayload,
} from '@/domain/infrastructures/midtrans.interface';
import { createMidtransSignatureKey } from '@/helpers/common.helper';
import AppError from '@/helpers/error.helper';
import axios from 'axios';

const baseURL = config.midtrans.baseUrl;
const api = axios.create({ baseURL, auth: { username: config.midtrans.serverKey, password: '' } });

export default class MidtransRepository {
  async charge(payload: MidtransChargePayload) {
    try {
      const { data } = await api.post<MidtransChargeResponse>('/v2/charge', payload);
      return data;
    } catch (e: any) {
      console.log(e.response);
      throw new AppError('Midtrans payment error.', 500);
    }
  }

  async getStatus(orderId: string) {
    const { data } = await api.get<MidtransChargeResponse>(
      `/v2/${encodeURIComponent(orderId)}/status`,
    );
    return data;
  }

  async cancel(orderId: string) {
    return api.post(`/v2/${encodeURIComponent(orderId)}/cancel`);
  }

  verifySignature(
    payload: Pick<MidtransWebhookPayload, 'order_id' | 'gross_amount' | 'signature_key'> & {
      status_code: string;
    },
  ) {
    const value = `${payload.order_id}${payload.status_code}${payload.gross_amount}${config.midtrans.serverKey}`;
    return createMidtransSignatureKey(value) === payload.signature_key;
  }
}
