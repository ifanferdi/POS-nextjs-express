import { OrderRelation, OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { OrderPayment } from '@/domain/entities/models/order';
import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import { ErrorBadRequest } from '@/helpers/error.helper';
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

  async execute(params: SyncMidtransToDatabaseDto, isMockData = false) {
    const { orderNumber, notification } = params;

    if (!isMockData) this.verifyMidtransSignature(notification);

    let checkOrder = await this.checkOrderPayment(orderNumber);
    if (!checkOrder) return;

    let { order, payment } = checkOrder;

    const status = this.mapStatus(notification);
    if (status === PaymentStatus.PENDING) return;

    const orderStatus = this.handleGetOrderStatus(status);

    // Atomic claim: only ONE concurrent notification may transition the payment out of `pending`.
    // Losers get count 0 and return, so the order update and stock refund happen exactly once.
    // payment success or expired would be update here
    const claimed = await this.repositories.paymentRepository.claimStatus(
      payment.id,
      PaymentStatus.PENDING,
      status,
    );
    if (!claimed) return;

    await this.repositories.orderRepository.midtransPaymentSuccess(
      { id: order.id, status: orderStatus },
      {
        id: payment.id,
        status: status,
        paidAt: status === PaymentStatus.SUCCESS ? new Date() : undefined,
        midtransDetail: {
          midtransOrderId: notification.order_id,
          transactionId: notification.transaction_id,
          paymentType: notification.payment_type,
          transactionStatus: notification.transaction_status,
          fraudStatus: notification.fraud_status,
          signatureVerified: Boolean(notification),
          rawNotification: notification,
        },
      },
    );

    const updatedOrder = await this.repositories.orderRepository.findOne<OrderPayment>({
      id: payment.orderId,
      with: [OrderRelation.PAYMENT],
    });

    await publishSSEEvent({
      scope: 'order',
      entity: 'order',
      action: 'status',
      data: updatedOrder ? [updatedOrder] : [],
    });

    return updatedOrder;
  }

  private handleGetOrderStatus(status: PaymentStatus) {
    if (status === PaymentStatus.SUCCESS) return OrderStatus.COMPLETED;
    else if (status === PaymentStatus.EXPIRED) return OrderStatus.EXPIRED;
    else if (this.validPaymentStatus.has(status)) return OrderStatus.CANCELLED;
    else return OrderStatus.PENDING;
  }

  private mapStatus(status: MidtransWebhookPayload) {
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

  private verifyMidtransSignature(payload: MidtransWebhookPayload) {
    const { order_id, status_code, gross_amount, signature_key } = payload;

    const isValidSignatureKey = this.repositories.midtransRepository.verifySignature({
      order_id,
      status_code,
      gross_amount,
      signature_key,
    });

    if (!isValidSignatureKey) throw new ErrorBadRequest('Invalid midtrans signature key');
  }

  private async checkOrderPayment(orderNumber: string) {
    let order = await this.repositories.orderRepository.findOne<OrderPayment>({
      orderNumber,
      with: [OrderRelation.PAYMENT],
    });

    if (!order) {
      console.error(`Order with order number ${orderNumber} not found`, 404);
      return;
    }

    const payment = order.payment;
    if (!payment) {
      console.error(`Payment for order ${orderNumber} not found`, 404);
      return;
    }

    return { order, payment };
  }
}
