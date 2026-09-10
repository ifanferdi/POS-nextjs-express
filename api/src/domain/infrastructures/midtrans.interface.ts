// export type MidtransChargeResponse = {
//   status_code: string;
//   status_message: string;
//   transaction_id: string;
//   order_id: string;
//   currency: string;
//   merchant_id: string;
//   gross_amount: string;
//   payment_type: string;
//   transaction_time: string;
//   transaction_status: string;
//   fraud_status: string;
//   signature_key: string;
//   va_numbers?: { bank: string; va_number: string }[];
//   permata_va_number?: string;
//   bill_key?: string;
//   biller_code?: string;
//   actions?: { name: string; method: string; url: string }[];
//   qr_string?: string;
//   expiry_time?: string;
// };

export type MidtransTransactionStatus =
  | 'pending'
  | 'settlement'
  | 'capture'
  | 'deny'
  | 'cancel'
  | 'expire'
  | 'failure'
  | 'refund'
  | 'partial_refund';

export type MidtransPaymentType = 'qris' | 'bank_transfer' | 'echannel';

// Field yang selalu sama di charge, webhook, DAN status
interface MidtransTransactionBase {
  transaction_time: string;
  transaction_status: MidtransTransactionStatus;
  transaction_id: string;
  status_message: string;
  status_code: string;
  payment_type: MidtransPaymentType;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status: 'accept' | 'deny' | 'challenge';
  currency: string;
  settlement_time?: string;
  expiry_time?: string;
}

export type MidtransStatusResponse = MidtransTransactionBase & {
  signature_key: string;
  va_numbers?: { bank: Bank; va_number: string }[]; // bank_transfer
  payment_amounts?: { paid_at: string; amount: string }[]; // bank_transfer
  bill_key?: string; // echannel mandiri
  biller_code?: string; // echannel mandiri
};

export type MidtransWebhookPayload = MidtransTransactionBase & {
  customer_details: Record<string, any>; // customer details
  signature_key: string;
  va_numbers?: { bank: Bank; va_number: string }[]; // bank_transfer
  payment_amounts?: { paid_at: string; amount: string }[]; // bank_transfer
  bill_key?: string; // echannel mandiri
  biller_code?: string; // echannel mandiri
};

export type MidtransChargeResponse = MidtransTransactionBase & {
  actions?: { name: string; method: 'GET' | 'POST'; url: string }[]; // qris
  acquirer?: string; // qris
  qr_string?: string; // qris
  va_numbers?: { bank: Bank; va_number: string }[]; // bank_transfer
  bill_key?: string; // echannel mandiri
  biller_code?: string; // echannel mandiri
};

export interface MidtransChargeBasePayload {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: MidtransItemDetail[];
  custom_expiry?: {
    expiry_duration: number;
    unit: 'second' | 'minute' | 'hour' | 'day';
  };
}

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface QrisChargePayload extends MidtransChargeBasePayload {
  payment_type: 'qris';
}

type Bank = 'bca' | 'bni' | 'bri' | 'permata';
export interface BankTransferChargePayload extends MidtransChargeBasePayload {
  payment_type: 'bank_transfer';
  bank_transfer: { bank: Bank };
}

export interface EchannelChargePayload extends MidtransChargeBasePayload {
  payment_type: 'echannel';
  echannel: { bill_info1?: string; bill_info2?: string };
}

export type MidtransChargePayload =
  | QrisChargePayload
  | BankTransferChargePayload
  | EchannelChargePayload;
