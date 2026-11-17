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
const api = axios.create({
  baseURL,
  timeout: config.api.timeout,
  auth: { username: config.midtrans.serverKey, password: '' },
});

export class MidtransChargeError extends AppError {
  constructor(
    message: string,
    readonly definiteRejection: boolean,
  ) {
    super(message, 500);
  }
}

export default class MidtransRepository {
  async charge(payload: MidtransChargePayload) {
    try {
      const { data } = await api.post<MidtransChargeResponse>('/v2/charge', payload);
      return data;
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      console.error(
        'Midtrans charge failed:',
        axios.isAxiosError(error) ? (error.response?.data ?? error.message) : error,
      );
      const definiteRejection =
        status !== undefined && [400, 401, 402, 403, 405, 410, 413, 429].includes(status);
      throw new MidtransChargeError('Midtrans payment error.', definiteRejection);
    }
  }

  async getStatus(orderId: string) {
    try {
      const { data } = await api.get<MidtransChargeResponse>(
        `/v2/${encodeURIComponent(orderId)}/status`,
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
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
