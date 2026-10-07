import config from '@/config/config';
import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { UserRelation } from '@/domain/entities/enums/user.enum';
import {
  MetaOrder,
  MetaOrderItems,
  StoreOrderDto,
  StoreOrderDtoItems,
  StoreOrderResponse,
} from '@/domain/entities/models/order';
import { PaymentMidtransDetail } from '@/domain/entities/models/payment';
import { IUserProfile } from '@/domain/entities/models/user';
import {
  MidtransChargeBasePayload,
  MidtransChargePayload,
} from '@/domain/infrastructures/midtrans.interface';
import { calculateRounding } from '@/helpers/common.helper';
import { ErrorBadRequest, ErrorConflict } from '@/helpers/error.helper';
import { Product } from '@/infrastructure/database/prisma/generated/client';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateOrderDto } from '@/validations/order-validation';
import FindAllProduct from '../product/find-all-product';
import FindByIdUser from '../user/find-by-id-user';

const EXPIRY_IN_MINUTES = config.midtrans.expiryMinutes;

const IDEMPOTENCY_TTL = config.redis.idempotencyKeyTtl;
const IDEMPOTENCY_IN_PROGRESS = '__IN_PROGRESS__';
const IDEMPOTENCY_POLL_TIMEOUT_MS = 5_000;
const IDEMPOTENCY_POLL_INTERVAL_MS = 100;

type OrderResponse = { message: string; order: StoreOrderResponse };

export default class CreateOrder extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.redisClient);
  private findAllProducts = new FindAllProduct(this.redisClient);

  get now() {
    return new Date();
  }

  async execute(payload: CreateOrderDto) {
    const key = this.idempotencyKey(payload.userId, payload.idempotencyKey);

    const cached = await this.repositories.redisRepository.findOne(key);
    if (cached && cached !== IDEMPOTENCY_IN_PROGRESS)
      return { isIdempoten: true, data: cached as OrderResponse };

    const claimed = await this.repositories.redisRepository.storeNX(
      key,
      IDEMPOTENCY_IN_PROGRESS,
      IDEMPOTENCY_TTL,
    );
    if (!claimed) return { isIdempoten: true, data: await this.waitForIdempotency(key) };

    try {
      const result = await this.createOrderInternal(payload);
      const data: OrderResponse = { message: 'Success.', order: result.order };
      await this.repositories.redisRepository.store({
        key,
        value: data,
        expired: IDEMPOTENCY_TTL,
        logging: false,
      });
      return { isIdempoten: false, data };
    } catch (error) {
      await this.repositories.redisRepository.destroy(key);
      throw error;
    }
  }

  private idempotencyKey(userId: number, key: string) {
    return `order:idempotency:${userId}:${key}`;
  }

  private async waitForIdempotency(key: string): Promise<OrderResponse> {
    const deadline = Date.now() + IDEMPOTENCY_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, IDEMPOTENCY_POLL_INTERVAL_MS));
      const value = await this.repositories.redisRepository.findOne(key);
      if (value && value !== IDEMPOTENCY_IN_PROGRESS) return value as OrderResponse;
    }
    throw new ErrorConflict('Permintaan serupa sedang diproses. Silakan coba lagi.');
  }

  private async createOrderInternal(payload: CreateOrderDto) {
    const productIds = payload.items.map((i) => i.productId);
    const { data: products } = await this.findAllProducts.execute({
      ids: productIds,
      limit: -1,
      isActive: true,
    });

    const productMap: Map<number, Product> = new Map(products.map((p: any) => [p.id, p]));

    const meta: MetaOrder = await this.handleMetaData(payload);

    const computedItems: StoreOrderDtoItems[] = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product)
        throw new ErrorBadRequest(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      const meta: MetaOrderItems = { product };

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
        meta,
      };
    });

    const subtotal = computedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;

    const isOnlinePayment = payload.paymentMethod !== PaymentMethod.CASH;
    const rounding = isOnlinePayment ? 0 : calculateRounding(total).rounding;
    const totalRounding = isOnlinePayment ? total : calculateRounding(total).total;
    const amount = isOnlinePayment ? total : (payload.amount ?? 0);

    const storeInput: StoreOrderDto = {
      userId: payload.userId,
      subtotal,
      tax,
      discount,
      total,
      notes: payload.notes,
      items: computedItems,
      meta,
      payment: {
        amount,
        change: isOnlinePayment ? 0 : amount - totalRounding,
        rounding,
        total: totalRounding,
        method: payload.paymentMethod,
      },
    };

    const order = await this.repositories.orderRepository.store(storeInput);

    if (isOnlinePayment)
      return await this.handleOnlinePayment(order, total, computedItems, payload);

    await publishSSEEvent({
      scope: 'order',
      entity: 'order',
      action: 'create',
      data: [order],
    });
    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'update',
      data: order.orderItems.map((orderItem) => orderItem.product),
    });

    return { order };
  }

  private async handleOnlinePayment(
    order: StoreOrderResponse,
    total: number,
    computedItems: StoreOrderDtoItems[],
    payload: CreateOrderDto,
  ) {
    const chargePayload = this.handleChargePayload(order, total, computedItems, payload);

    const chargeResult = await this.repositories.midtransRepository!.charge(chargePayload);

    const vaNumber = chargeResult.va_numbers?.[0]?.va_number || chargeResult.bill_key;
    const qrCodeUrl = chargeResult.actions?.find((a) => a.name === 'generate-qr-code')?.url;

    const expiredAt = chargeResult.expiry_time ? new Date(chargeResult.expiry_time) : undefined;

    order.payment = await this.repositories.paymentRepository.update<PaymentMidtransDetail>({
      orderId: order.id,
      expiredAt,
      midtransDetail: {
        midtransOrderId: order.orderNumber,
        transactionId: chargeResult.transaction_id,
        paymentType: chargeResult.payment_type,
        vaNumber,
        qrCodeUrl,
      },
    });

    return {
      order,
      paymentType: chargeResult.payment_type,
      vaNumber,
      qrCodeUrl,
    };
  }

  private handleChargePayload(
    order: StoreOrderResponse,
    total: number,
    computedItems: StoreOrderDtoItems[],
    payload: CreateOrderDto,
  ): MidtransChargePayload {
    const chargePayload: MidtransChargeBasePayload = {
      transaction_details: { order_id: order.orderNumber, gross_amount: total },
      item_details: computedItems.map((item) => ({
        id: String(item.productId),
        price: item.unitPrice,
        quantity: item.quantity,
        name: `Product ${item.meta?.product?.name || item.productId}`,
      })),
      custom_expiry: { expiry_duration: EXPIRY_IN_MINUTES, unit: 'minute' },
    };

    if (payload.paymentMethod === PaymentMethod.QRIS)
      return { ...chargePayload, payment_type: 'qris' } as MidtransChargePayload;
    else if (
      [PaymentMethod.VA_BCA, PaymentMethod.VA_BNI, PaymentMethod.VA_BRI].includes(
        payload.paymentMethod,
      )
    )
      return {
        ...chargePayload,
        payment_type: 'bank_transfer',
        bank_transfer: { bank: payload.paymentMethod.split('_')[1].toLowerCase() },
      } as MidtransChargePayload;
    else if (payload.paymentMethod === PaymentMethod.VA_MANDIRI)
      return {
        ...chargePayload,
        payment_type: 'echannel',
        echannel: { bill_info1: 'Payment', bill_info2: 'Online Order' },
      } as MidtransChargePayload;

    throw new ErrorBadRequest(`Payment method ${payload.paymentMethod} not supported.`);
  }

  private async handleMetaData(payload: CreateOrderDto) {
    let user: IUserProfile | undefined;
    if (payload.userId)
      user = (await this.findByIdUser.execute({
        id: payload.userId,
        with: [UserRelation.PROFILE],
      })) as IUserProfile;

    const meta: MetaOrder = {};
    if (user) meta.user = user;

    return meta;
  }
}
