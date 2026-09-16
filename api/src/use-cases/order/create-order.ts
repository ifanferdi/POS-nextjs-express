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
import { ErrorBadRequest } from '@/helpers/error.helper';
import { Product } from '@/infrastructure/database/prisma/generated/client';
import { Decimal } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateOrderDto } from '@/validations/order-validation';
import FindAllProduct from '../product/find-all-product';
import FindByIdUser from '../user/find-by-id-user';

const EXPIRY_IN_MINUTES = config.midtrans.expiryMinutes;

export default class CreateOrder extends BaseUseCase {
  private findByIdUser = new FindByIdUser(this.repositories);
  private findAllProducts = new FindAllProduct(this.repositories);

  get now() {
    return new Date();
  }

  async execute(payload: CreateOrderDto) {
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
    const rounding = isOnlinePayment ? Decimal(0) : calculateRounding(Decimal(total)).rounding;
    const totalRounding = isOnlinePayment
      ? Decimal(total)
      : calculateRounding(Decimal(total)).total;
    const amount = isOnlinePayment ? Decimal(total) : Decimal(payload.amount ?? 0);

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
        change: isOnlinePayment ? Decimal(0) : amount.minus(totalRounding),
        rounding,
        total: totalRounding,
        method: payload.paymentMethod,
        reference: payload.paymentReference ?? null,
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

    return order;
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

    order.payment = await this.repositories.paymentRepository.update<PaymentMidtransDetail>({
      orderId: order.id,
      reference: order.orderNumber,
      midtransDetail: {
        midtransOrderId: order.orderNumber,
        transactionId: chargeResult.transaction_id,
        paymentType: chargeResult.payment_type,
        vaNumber,
        qrCodeUrl,
        expiryTime: chargeResult.expiry_time ? new Date(chargeResult.expiry_time) : undefined,
      },
    });

    return {
      order,
      paymentType: chargeResult.payment_type,
      vaNumber,
      qrCodeUrl,
      expiryTime: chargeResult.expiry_time,
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
