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
import {
  effectiveUnitDiscount,
  ensureRemainingCounter,
  redisRemainingKey,
  selectItemDiscount,
} from '@/helpers/discount.helper';
import { ErrorBadRequest, ErrorConflict } from '@/helpers/error.helper';
import { Product, ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateOrderDto } from '@/validations/order-validation';
import _ from 'lodash';
import FindAllProduct from '../product/find-all-product';
import FindByIdUser from '../user/find-by-id-user';

const EXPIRY_IN_MINUTES = config.midtrans.expiryMinutes;

const IDEMPOTENCY_TTL = config.redis.idempotencyKeyTtl;
const IDEMPOTENCY_IN_PROGRESS = '__IN_PROGRESS__';
const IDEMPOTENCY_POLL_TIMEOUT_MS = 5_000;
const IDEMPOTENCY_POLL_INTERVAL_MS = 100;

type OrderResponse = { message: string; order: StoreOrderResponse };

export default class CreateOrder extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);
  private findAllProducts = new FindAllProduct(this.repositories);

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
          return [{ id: baseId, price: item.unitPrice, quantity: item.quantity, name }];

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
