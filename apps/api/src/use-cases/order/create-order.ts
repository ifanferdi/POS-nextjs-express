import config from '@/config/config';
import { OrderRelation, OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/enums/payment.enum';
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
  MidtransChargeResponse,
} from '@/domain/infrastructures/midtrans.interface';
import { calculateRounding } from '@/helpers/common.helper';
import {
  effectiveUnitDiscount,
  ensureRemainingCounter,
  redisRemainingKey,
  selectItemDiscount,
} from '@/helpers/discount.helper';
import { ErrorBadRequest, ErrorConflict, ErrorInternalServer } from '@/helpers/error.helper';
import { Product, ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import { MidtransChargeError } from '@/repositories/midtrans/midtrans-repository';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateOrderDto } from '@/validations/order-validation';
import _ from 'lodash';
import FindAllProduct from '../product/find-all-product';
import FindByIdUser from '../user/find-by-id-user';

const EXPIRY_IN_MINUTES = config.midtrans.expiryMinutes;

const IDEMPOTENCY_TTL = config.redis.idempotencyKeyTtl;
const IDEMPOTENCY_IN_PROGRESS = '__IN_PROGRESS__';
const IDEMPOTENCY_CHARGE_FAILED = '__CHARGE_FAILED__';
const IDEMPOTENCY_POLL_TIMEOUT_MS = 5_000;
const IDEMPOTENCY_POLL_INTERVAL_MS = 100;

type OrderResponse = { message: string; order: StoreOrderResponse };

class ChargeFailureError extends ErrorBadRequest {
  constructor() {
    super('Midtrans menolak pembayaran. Stok dan kuota promo sudah dipulihkan.');
  }
}

class ChargeOutcomeUncertainError extends ErrorInternalServer {
  constructor(
    readonly orderId: number,
    readonly orderNumber: string,
  ) {
    super('Status pembayaran belum dapat dipastikan. Pesanan tetap ditahan untuk direkonsiliasi.');
  }
}

class PreChargeFailureError extends ErrorInternalServer {
  constructor() {
    super('Pesanan gagal sebelum pembayaran dikirim. Stok dan kuota promo sudah dipulihkan.');
  }
}

type UncertainIdempotencyRecord = {
  state: 'uncertain';
  orderId: number;
  orderNumber: string;
};

export default class CreateOrder extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);
  private findAllProducts = new FindAllProduct(this.repositories);

  get now() {
    return new Date();
  }

  async execute(payload: CreateOrderDto) {
    const key = this.idempotencyKey(payload.userId, payload.idempotencyKey);

    const existing = await this.repositories.orderRepository.findByIdempotencyKey(
      payload.userId,
      payload.idempotencyKey,
    );
    if (existing)
      return this.reconcileUncertainOrder(key, {
        state: 'uncertain',
        orderId: existing.id,
        orderNumber: existing.orderNumber,
      });

    const cached = await this.repositories.redisRepository.findOne(key);
    if (cached === IDEMPOTENCY_CHARGE_FAILED) throw new ChargeFailureError();
    if (this.isUncertainRecord(cached)) return this.reconcileUncertainOrder(key, cached);
    if (cached && cached !== IDEMPOTENCY_IN_PROGRESS)
      return { isIdempoten: true, data: cached as OrderResponse };

    const claimed = await this.repositories.redisRepository.storeNX(
      key,
      IDEMPOTENCY_IN_PROGRESS,
      IDEMPOTENCY_TTL,
    );
    if (!claimed) {
      const result = await this.waitForIdempotency(key);
      if (this.isUncertainRecord(result)) return this.reconcileUncertainOrder(key, result);
      return { isIdempoten: true, data: result };
    }

    try {
      const result = await this.createOrderInternal(payload, key);
      const data: OrderResponse = { message: 'Success.', order: result.order };
      await this.repositories.redisRepository.store({
        key,
        value: data,
        expired: IDEMPOTENCY_TTL,
        logging: false,
      });
      return { isIdempoten: false, data };
    } catch (error) {
      if (error instanceof ChargeFailureError || error instanceof PreChargeFailureError) {
        await this.repositories.redisRepository.store({
          key,
          value: IDEMPOTENCY_CHARGE_FAILED,
          logging: false,
        });
      } else if (error instanceof ChargeOutcomeUncertainError) {
        await this.repositories.redisRepository.store({
          key,
          value: {
            state: 'uncertain',
            orderId: error.orderId,
            orderNumber: error.orderNumber,
          },
          logging: false,
        });
      } else {
        await this.repositories.redisRepository.destroy(key);
      }
      throw error;
    }
  }

  private idempotencyKey(userId: number, key: string) {
    return `order:idempotency:${userId}:${key}`;
  }

  private isUncertainRecord(value: unknown): value is UncertainIdempotencyRecord {
    if (!_.isPlainObject(value)) return false;
    const record = value as Record<string, unknown>;
    return (
      record.state === 'uncertain' &&
      typeof record.orderId === 'number' &&
      typeof record.orderNumber === 'string'
    );
  }

  private async reconcileUncertainOrder(key: string, record: UncertainIdempotencyRecord) {
    const order = await this.repositories.orderRepository.findOne<StoreOrderResponse>({
      id: record.orderId,
      with: [
        OrderRelation.ORDER_ITEMS_PRODUCT,
        OrderRelation.PAYMENT,
        OrderRelation.PAYMENT_MIDTRANS,
        OrderRelation.USER_PROFILE,
      ],
    });
    if (!order?.payment) throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');

    if (order.status === OrderStatus.COMPLETED) return this.cacheRecoveredOrder(key, order);
    if ([OrderStatus.CANCELLED, OrderStatus.EXPIRED].some((status) => status === order.status)) {
      if (order.payment.status === PaymentStatus.FAILED) await this.restoreFailedQuota(order.id);
      await this.repositories.redisRepository.store({
        key,
        value: IDEMPOTENCY_CHARGE_FAILED,
        logging: false,
      });
      throw new ChargeFailureError();
    }

    let status: MidtransChargeResponse | null;
    try {
      status = await this.repositories.midtransRepository.getStatus(record.orderNumber);
    } catch {
      throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');
    }
    if (!status) throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');

    if (status.transaction_status === 'pending') {
      await this.updateMidtransPayment(order, status);
      return this.cacheRecoveredOrder(key, order);
    }
    if (this.isSuccessfulMidtransStatus(status))
      return this.completeRecoveredOrder(key, order, status);
    if (['deny', 'cancel', 'expire', 'failure'].includes(status.transaction_status)) {
      try {
        await this.releaseFailedOnlineOrder(order);
      } catch (error) {
        if (error instanceof ChargeFailureError)
          await this.repositories.redisRepository.store({
            key,
            value: IDEMPOTENCY_CHARGE_FAILED,
            logging: false,
          });
        throw error;
      }
    }

    throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');
  }

  private async cacheRecoveredOrder(key: string, order: StoreOrderResponse) {
    const data: OrderResponse = { message: 'Success.', order };
    await this.repositories.redisRepository.store({
      key,
      value: data,
      expired: IDEMPOTENCY_TTL,
      logging: false,
    });
    return { isIdempoten: true, data };
  }

  private isSuccessfulMidtransStatus(status: MidtransChargeResponse) {
    return (
      ['capture', 'settlement'].includes(status.transaction_status) &&
      (!status.fraud_status || status.fraud_status === 'accept')
    );
  }

  private async completeRecoveredOrder(
    key: string,
    order: StoreOrderResponse,
    status: MidtransChargeResponse,
  ) {
    await this.repositories.orderRepository.midtransPaymentSuccess(
      { id: order.id, status: OrderStatus.COMPLETED },
      {
        id: order.payment.id,
        status: PaymentStatus.SUCCESS,
        paidAt: status.settlement_time ? new Date(status.settlement_time) : new Date(),
        midtransDetail: {
          midtransOrderId: order.orderNumber,
          transactionId: status.transaction_id,
          paymentType: status.payment_type,
          transactionStatus: status.transaction_status,
          fraudStatus: status.fraud_status,
          signatureVerified: true,
          rawNotification: status as unknown as Record<string, any>,
        },
      },
    );
    const updated = await this.repositories.orderRepository.findOne<StoreOrderResponse>({
      id: order.id,
      with: [
        OrderRelation.ORDER_ITEMS_PRODUCT,
        OrderRelation.PAYMENT,
        OrderRelation.PAYMENT_MIDTRANS,
        OrderRelation.USER_PROFILE,
      ],
    });
    if (!updated || updated.status !== OrderStatus.COMPLETED)
      throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');
    return this.cacheRecoveredOrder(key, updated);
  }

  private async waitForIdempotency(
    key: string,
  ): Promise<OrderResponse | UncertainIdempotencyRecord> {
    const deadline = Date.now() + IDEMPOTENCY_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, IDEMPOTENCY_POLL_INTERVAL_MS));
      const value = await this.repositories.redisRepository.findOne(key);
      if (value === IDEMPOTENCY_CHARGE_FAILED) throw new ChargeFailureError();
      if (this.isUncertainRecord(value)) return value;
      if (value && value !== IDEMPOTENCY_IN_PROGRESS) return value as OrderResponse;
    }
    throw new ErrorConflict('Permintaan serupa sedang diproses. Silakan coba lagi.');
  }

  private async createOrderInternal(payload: CreateOrderDto, idempotencyKey: string) {
    const productIds = payload.items.map((i) => i.productId);
    const { data: products } = await this.findAllProducts.execute({
      ids: productIds,
      limit: -1,
      isActive: true,
    });

    const productMap: Map<number, Product> = new Map(products.map((p: any) => [p.id, p]));

    const activeDiscounts = await this.repositories.productDiscountCycleRepository.findActive(
      productIds,
      this.now,
    );
    const discountMap = new Map<number, ProductDiscountCycle>();
    activeDiscounts.forEach((discount) => {
      if (!discountMap.has(discount.productId)) discountMap.set(discount.productId, discount);
    });

    const computedItems: StoreOrderDtoItems[] = [];
    const claims: Array<{ key: string; take: number }> = [];

    for (const item of payload.items) {
      const product = productMap.get(item.productId);
      if (!product)
        throw new ErrorBadRequest(`Produk dengan ID ${item.productId} tidak ditemukan.`);

      // Row diproses berurutan: row promo lebih awal diprioritaskan mendapat kuota.
      // useDiscount default false → row tanpa flag / false = harga normal, tidak claim kuota.
      const discount = selectItemDiscount(item.useDiscount, discountMap.get(item.productId));
      const take = discount ? await this.claimUnits(discount, item.quantity) : 0;
      const meta: MetaOrderItems = { product };

      if (discount && take > 0) {
        const discountAmount = effectiveUnitDiscount(discount.amount, product.price) * take;
        meta.discount = discount;
        meta.discountAmount = discountAmount;
        meta.discountQty = take;
        if (discount.quota != null) claims.push({ key: redisRemainingKey(discount.id), take });
      }

      computedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
        discountId: discount && take > 0 ? discount.id : undefined,
        discountQty: discount && take > 0 ? take : undefined,
        meta,
      });
    }

    const meta: MetaOrder = await this.handleMetaData(payload);
    const snapshotAt = this.now;
    meta.products = _.uniqBy(
      computedItems.map((item) => ({ ...item.meta!.product!, snapshotAt })),
      'id',
    );
    meta.discounts = _.uniqBy(
      computedItems
        .filter((item) => item.meta?.discount)
        .map((item) => ({ ...item.meta!.discount!, snapshotAt })),
      'id',
    );

    const subtotal = computedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalDiscount = computedItems.reduce(
      (sum, item) => sum + (item.meta?.discountAmount ?? 0),
      0,
    );
    const total = subtotal - totalDiscount;

    const isOnlinePayment = payload.paymentMethod !== PaymentMethod.CASH;
    const rounding = isOnlinePayment ? 0 : calculateRounding(total).rounding;
    const totalRounding = isOnlinePayment ? total : calculateRounding(total).total;
    const amount = isOnlinePayment ? total : (payload.amount ?? 0);

    const storeInput: StoreOrderDto = {
      idempotencyKey: payload.idempotencyKey,
      userId: payload.userId,
      subtotal,
      totalDiscount,
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

    let order: StoreOrderResponse;
    try {
      order = await this.repositories.orderRepository.store(storeInput);
    } catch (error) {
      // Transaksi DB rollback → kembalikan claim Redis agar kuota tidak ikut terbakar.
      await Promise.allSettled(
        claims.map((claim) => this.repositories.redisRepository.incrBy(claim.key, claim.take)),
      );
      throw error;
    }

    if (isOnlinePayment) {
      try {
        await this.repositories.redisRepository.store({
          key: idempotencyKey,
          value: {
            state: 'uncertain',
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
          logging: false,
        });
      } catch {
        try {
          await this.releaseFailedOnlineOrder(order);
        } catch (error) {
          if (error instanceof ChargeFailureError) throw new PreChargeFailureError();
          throw error;
        }
        throw new PreChargeFailureError();
      }
      return await this.handleOnlinePayment(order, total, computedItems, payload);
    }

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

  private async claimUnits(discount: ProductDiscountCycle, quantity: number) {
    if (discount.quota == null) return quantity;

    await ensureRemainingCounter(discount, this.repositories.redisRepository);
    const take = await this.repositories.redisRepository.claimRemaining(
      redisRemainingKey(discount.id),
      quantity,
    );

    return Math.max(take, 0);
  }

  private async handleOnlinePayment(
    order: StoreOrderResponse,
    total: number,
    computedItems: StoreOrderDtoItems[],
    payload: CreateOrderDto,
  ) {
    const chargePayload = this.handleChargePayload(order, total, computedItems, payload);

    let chargeResult: MidtransChargeResponse | undefined;
    try {
      chargeResult = await this.repositories.midtransRepository.charge(chargePayload);
    } catch (error: unknown) {
      if (error instanceof MidtransChargeError && error.definiteRejection)
        await this.releaseFailedOnlineOrder(order);

      let status: MidtransChargeResponse | null;
      try {
        status = await this.repositories.midtransRepository.getStatus(order.orderNumber);
      } catch {
        throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
      }

      if (
        status &&
        (status.transaction_status === 'pending' || this.isSuccessfulMidtransStatus(status))
      ) {
        chargeResult = status;
      } else if (
        status &&
        ['deny', 'cancel', 'expire', 'failure'].includes(status.transaction_status)
      ) {
        await this.releaseFailedOnlineOrder(order);
      } else {
        throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
      }
    }

    if (!chargeResult) throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
    if (['deny', 'cancel', 'expire', 'failure'].includes(chargeResult.transaction_status))
      await this.releaseFailedOnlineOrder(order);
    if (this.isSuccessfulMidtransStatus(chargeResult)) {
      const recovered = await this.completeRecoveredOrder(
        this.idempotencyKey(payload.userId, payload.idempotencyKey),
        order,
        chargeResult,
      );
      return { order: recovered.data.order };
    }

    if (chargeResult.transaction_status !== 'pending')
      throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);

    const vaNumber = chargeResult.va_numbers?.[0]?.va_number || chargeResult.bill_key;
    const qrCodeUrl = this.qrCodeUrl(order, chargeResult);

    await this.updateMidtransPayment(order, chargeResult);

    return {
      order,
      paymentType: chargeResult.payment_type,
      vaNumber,
      qrCodeUrl,
    };
  }

  private async releaseFailedOnlineOrder(order: StoreOrderResponse): Promise<never> {
    let failedOrder;
    try {
      failedOrder = await this.repositories.orderRepository.failOnlineCharge(order.id);
    } catch {
      throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
    }
    if (!failedOrder) throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);

    try {
      await this.restoreFailedQuota(order.id);
    } catch {
      throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
    }
    try {
      const { data: products } = await this.findAllProducts.execute({
        ids: failedOrder.order.orderItems.flatMap((item) =>
          item.productId ? [item.productId] : [],
        ),
        limit: -1,
      });
      await publishSSEEvent({
        scope: 'product',
        entity: 'product',
        action: 'update',
        data: products,
      });
    } catch (error) {
      console.error('Failed to publish restored product stock event:', error);
    }
    throw new ChargeFailureError();
  }

  private async restoreFailedQuota(orderId: number) {
    const claims = await this.repositories.orderRepository.failedOnlineChargeQuotaClaims(orderId);
    if (!claims) throw new ErrorConflict('Pesanan menunggu rekonsiliasi Midtrans.');
    await this.repositories.redisRepository.restoreQuotaOnce(orderId, claims);
  }

  private qrCodeUrl(order: StoreOrderResponse, status: MidtransChargeResponse) {
    return (
      status.actions?.find((action) => action.name === 'generate-qr-code')?.url ??
      order.payment.midtransDetail?.qrCodeUrl ??
      (status.payment_type === 'qris'
        ? `${config.midtrans.baseUrl}/v2/qris/${encodeURIComponent(status.transaction_id)}/qr-code`
        : undefined)
    );
  }

  private async updateMidtransPayment(order: StoreOrderResponse, status: MidtransChargeResponse) {
    const vaNumber = status.va_numbers?.[0]?.va_number || status.bill_key;
    const qrCodeUrl = this.qrCodeUrl(order, status);
    try {
      const payment =
        await this.repositories.paymentRepository.updateMidtransDetails<PaymentMidtransDetail>({
          orderId: order.id,
          expiredAt: status.expiry_time ? new Date(status.expiry_time) : undefined,
          midtransDetail: {
            midtransOrderId: order.orderNumber,
            transactionId: status.transaction_id,
            paymentType: status.payment_type,
            vaNumber,
            qrCodeUrl,
          },
        });
      if (!payment) throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
      order.payment = payment;
    } catch {
      throw new ChargeOutcomeUncertainError(order.id, order.orderNumber);
    }
  }

  private handleChargePayload(
    order: StoreOrderResponse,
    total: number,
    computedItems: StoreOrderDtoItems[],
    payload: CreateOrderDto,
  ): MidtransChargePayload {
    const rowOccurrences = new Map<number, number>();
    const chargePayload: MidtransChargeBasePayload = {
      transaction_details: { order_id: order.orderNumber, gross_amount: total },
      // Midtrans: Σ item_details harus == gross_amount → harga bersih setelah diskon,
      // item partial dipecah 2 baris (unit berdiskon + unit harga normal).
      // id dibuat unik per row karena produk sama boleh muncul >1 row.
      item_details: computedItems.flatMap((item) => {
        const discount = item.meta?.discount;
        const take = item.discountQty ?? 0;
        const name = `Product ${item.meta?.product?.name || item.productId}`;
        const occurrence = rowOccurrences.get(item.productId) ?? 0;
        rowOccurrences.set(item.productId, occurrence + 1);
        const baseId =
          occurrence === 0 ? String(item.productId) : `${item.productId}-${occurrence}`;

        if (!discount || take <= 0)
          return [
            {
              id: baseId,
              price: item.unitPrice,
              quantity: item.quantity,
              name,
            },
          ];

        const netPrice =
          item.unitPrice - effectiveUnitDiscount(discount.amount ?? 0, item.unitPrice);

        if (take >= item.quantity)
          return [{ id: baseId, price: netPrice, quantity: item.quantity, name }];

        return [
          { id: baseId, price: netPrice, quantity: take, name },
          {
            id: `${baseId}-full`,
            price: item.unitPrice,
            quantity: item.quantity - take,
            name,
          },
        ];
      }),
      custom_expiry: { expiry_duration: EXPIRY_IN_MINUTES, unit: 'minute' },
    };

    if (payload.paymentMethod === PaymentMethod.QRIS)
      return {
        ...chargePayload,
        payment_type: 'qris',
      } as MidtransChargePayload;
    else if (
      [PaymentMethod.VA_BCA, PaymentMethod.VA_BNI, PaymentMethod.VA_BRI].includes(
        payload.paymentMethod,
      )
    )
      return {
        ...chargePayload,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: payload.paymentMethod.split('_')[1].toLowerCase(),
        },
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
