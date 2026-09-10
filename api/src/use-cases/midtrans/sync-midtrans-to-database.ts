import { OrderRelation, OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentStatus } from '@/domain/entities/enums/payment.enum';
import {
  MidtransChargeResponse,
  MidtransWebhookPayload,
} from '@/domain/infrastructures/midtrans.interface';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import { SyncMidtransToDatabaseDto } from '@/validations/midtrans.validation';
import BaseUseCase from '../_base-use-case';

export default class SyncMidtransToDatabase extends BaseUseCase {
  get validPaymentStatus() {
    return new Set<string>([
      PaymentStatus.SUCCESS,
      PaymentStatus.FAILED,
      PaymentStatus.EXPIRED,
      PaymentStatus.CANCELLED,
    ]);
  }

  async execute(params: SyncMidtransToDatabaseDto) {
    const { orderNumber, notification } = params;

    const status =
      notification ?? (await this.repositories.midtransRepository!.getStatus(orderNumber));
    let order = await this.repositories.orderRepository.findOne({
      orderNumber,
      with: [OrderRelation.PAYMENT],
    });

    if (!order) {
      console.trace(`Order with order number ${orderNumber} not found`, 404);
      return;
    }

    const payment = order.payment;
    if (!payment) {
      console.error(`Payment for order ${orderNumber} not found`, 404);
      return;
    }

    const next = this.mapStatus(status);

    const paymentData = await this.repositories.paymentRepository.findOne({
      id: payment.id,
      columns: ['id', 'status'],
    });
    let orderStatus = this.handleGetOrderStatus(next);

    // HANDLE IF MIDTRANS PAYMENT SUCCESS
    if (
      !paymentData ||
      paymentData.status === next ||
      this.validPaymentStatus.has(paymentData.status)
    )
      return;

    await this.repositories.orderRepository.midtransPaymentSuccess(
      { id: order.id, status: orderStatus },
      {
        id: payment.id,
        status: next,
        paidAt: next === PaymentStatus.SUCCESS ? new Date() : undefined,
        expiredAt: status?.expiry_time ? new Date(status?.expiry_time) : new Date(),
        midtransDetail: {
          midtransOrderId: status.order_id,
          transactionId: status.transaction_id,
          paymentType: status.payment_type,
          transactionStatus: status.transaction_status,
          fraudStatus: status.fraud_status,
          signatureVerified: Boolean(notification),
          rawNotification: notification ?? status,
        },
      },
    );

    order = await this.repositories.orderRepository.findOne({
      id: payment.orderId,
      with: [OrderRelation.PAYMENT],
    });

    await publishSSEEvent({
      scope: 'order',
      entity: 'order',
      action: 'status',
      data: order ? [order] : [],
    });

    return order;
  }

  private handleGetOrderStatus(status: PaymentStatus) {
    if (status === PaymentStatus.SUCCESS) return OrderStatus.COMPLETED;
    else if (status === PaymentStatus.EXPIRED) return OrderStatus.EXPIRED;
    else if (this.validPaymentStatus.has(status)) return OrderStatus.CANCELLED;
    else return OrderStatus.PENDING;
  }

  private mapStatus(status: MidtransWebhookPayload | MidtransChargeResponse) {
    if (status.transaction_status === 'expire') return PaymentStatus.EXPIRED;
    if (status.transaction_status === 'cancel') return PaymentStatus.CANCELLED;
    if (status.transaction_status === 'deny') return PaymentStatus.FAILED;
    if (
      ['settlement', 'capture'].includes(status.transaction_status) &&
      status.fraud_status !== 'challenge'
    )
      return PaymentStatus.SUCCESS;
    return PaymentStatus.PENDING;
  }
}
