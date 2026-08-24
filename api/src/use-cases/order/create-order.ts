import { UserRelation } from '@/domain/entities/enums/user.enum';
import { StoreOrderDto } from '@/domain/entities/models/order';
import { IUser } from '@/domain/entities/models/user';
import { calculateRounding } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateOrderDto } from '@/validations/order-validation';

export default class CreateOrder extends BaseUseCase {
  get now() {
    return new Date().toISOString();
  }

  async execute(payload: CreateOrderDto) {
    const productIds = payload.items.map((i) => i.productId);
    const products = await this.repositories.productRepository.findAll({
      ids: productIds,
      limit: -1,
      isActive: true,
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const meta: Record<string, any> = await this.handleMetaData(payload);

    const computedItems = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product)
        throw new ErrorBadRequest(`Produk dengan ID ${item.productId} tidak ditemukan.`);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: product.price * item.quantity,
        meta: {
          ...product,
          snapshotAt: this.now,
        },
      };
    });

    const subtotal = computedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;
    const { rounding, total: totalRounding } = calculateRounding(total);
    const amount = payload.amount ?? 0;

    const storeInput: StoreOrderDto = {
      customerId: payload.customerId,
      userId: payload.userId,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: payload.paymentMethod,
      notes: payload.notes,
      items: computedItems,
      meta,
      payment: {
        amount,
        change: total - amount,
        rounding,
        total: totalRounding,
        reference: payload.paymentReference,
      },
    };

    const order = await this.repositories.orderRepository.store(storeInput);

    await publishSSEEvent({ scope: 'order', entity: 'order', action: 'create', data: [order] });
    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'update',
      data: order.orderItems.map((orderItem) => orderItem.product),
    });

    return order;
  }

  private async handleMetaData(payload: CreateOrderDto) {
    let customer: IUser | undefined;
    let user: IUser | undefined;
    if (payload.customerId)
      customer = (await this.repositories.userRepository.findOne({
        id: payload.customerId,
        with: [UserRelation.PROFILE],
      })) as IUser;
    if (payload.userId)
      user = (await this.repositories.userRepository.findOne({
        id: payload.userId,
        with: [UserRelation.PROFILE],
      })) as IUser;

    const meta: Record<string, any> = {};
    if (customer) meta.customer = customer;
    if (user) meta.user = user;
    meta.snapshotAt = this.now;

    return meta;
  }
}
