import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { MidtransPaymentUpdate } from '@/domain/entities/models/midtrans-payment-detail';
import { StoreOrderDto, StoreOrderResponse } from '@/domain/entities/models/order';
import { Repository } from '@/domain/repositories/database.interface';
import AppError from '@/helpers/error.helper';
import { generateOrderNumber } from '@/helpers/generate-string';
import { Prisma } from '@/infrastructure/database/prisma/generated/client';
import DatabaseBaseRepository from '@/repositories/database/_database-base-repository';
import QueryOrderRepository from '@/repositories/database/queries/query-order-repository';
import {
  FindAllOrderDto,
  FindByIdOrderDto,
  FindOneOrderDto,
  UpdateOrderStatusDto,
} from '@/validations/order-validation';

export default class OrderRepository
  extends DatabaseBaseRepository
  implements
    Omit<
      Repository<FindAllOrderDto, FindByIdOrderDto, StoreOrderDto, UpdateOrderStatusDto>,
      'destroy'
    >
{
  private queryOrderRepository = new QueryOrderRepository();

  async findAll(params: Partial<FindAllOrderDto>) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * Number(limit);

    const query: Prisma.OrderFindManyArgs = {
      skip: offset,
      take: limit === -1 ? undefined : limit,
      where: this.queryOrderRepository.handleWhere(params),
      orderBy: this.queryOrderRepository.handleOrderBy(params),
      select: {
        ...this.queryOrderRepository.handleSelect(params?.columns),
        ...this.queryOrderRepository.handleInclude(params?.with),
      },
    };

    return this.prisma.order.findMany(query);
  }

  count(params: Partial<FindAllOrderDto>) {
    return this.prisma.order.count({
      where: this.queryOrderRepository.handleWhere(params),
    });
  }

  async findOne(params: FindByIdOrderDto | FindOneOrderDto) {
    return this.prisma.order.findFirst({
      where: this.queryOrderRepository.handleWhere(params),
      select: {
        ...this.queryOrderRepository.handleSelect(params?.columns),
        ...this.queryOrderRepository.handleInclude(params?.with),
      },
    });
  }

  async store(data: StoreOrderDto) {
    const { payment, subtotal, items, total, meta, ...orderData } = data;

    const order = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          subtotal,
          total,
          orderNumber: generateOrderNumber(),
          orderItems: { create: items.map((item) => ({ ...item })) },
        },
        include: { orderItems: { include: { product: true } } },
      });

      await tx.payment.create({
        data: {
          ...payment,
          orderId: order.id,
          subtotal,
          method: payment.method,
          status:
            payment.method === PaymentMethod.CASH ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status:
            payment.method === PaymentMethod.CASH ? OrderStatus.COMPLETED : OrderStatus.PENDING,
        },
      });

      // Atomic check + decrement: cegah race condition (TOCTOU)
      // UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        // 0 row ter-update → stok tidak cukup → throw → transaction rollback
        if (result.count === 0) {
          throw new AppError(`Stok produk ID ${item.productId} tidak mencukupi.`);
        }
      }
      return order;
    });

    return (await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: { include: { product: true } },
        payment: { include: { midtransDetail: true } },
        user: { include: { profile: true } },
      },
    })) as unknown as Promise<StoreOrderResponse>;
  }

  update(data: UpdateOrderStatusDto) {
    const { id, ...updateData } = data;
    return this.prisma.order.update({ where: { id }, data: updateData });
  }

  cancelOrder(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, status: { not: OrderStatus.CANCELLED } },
        include: { orderItems: true, payment: true },
      });

      if (!order) return;

      for (const item of order.orderItems) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      if (order.payment) {
        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      return tx.order.updateMany({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }

  midtransPaymentSuccess(
    order: { id: number; status: OrderStatus },
    payment: MidtransPaymentUpdate,
  ) {
    const { id: paymentId, midtransDetail, ...updatePayment } = payment;
    const { midtransOrderId, ...detail } = midtransDetail;

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...updatePayment,
          midtransDetail: {
            upsert: {
              create: { midtransOrderId, ...detail },
              update: detail,
            },
          },
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status: order.status } });

      const isRefunded = [
        PaymentStatus.FAILED,
        PaymentStatus.EXPIRED,
        PaymentStatus.CANCELLED,
      ].includes(payment.status);
      if (isRefunded) {
        const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
        for (const item of items)
          if (item.productId)
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
      }
    });
  }
}
