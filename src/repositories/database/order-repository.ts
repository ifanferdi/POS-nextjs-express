import { StoreOrderDto } from '../../domain/entities/models/order';
import { Repository } from '../../domain/repositories/database.interface';
import { generateOrderNumber } from '../../helpers/generate-string';
import { OrderStatus } from '../../domain/entities/enums/order.enum';
import { PaymentStatus } from '../../domain/entities/enums/payment.enum';
import { Prisma } from '../../infrastructure/database/prisma/generated/client';
import {
  FindAllOrderDto,
  FindByIdOrderDto,
  UpdateOrderStatusDto,
} from '../../validations/order-validation';
import DatabaseBaseRepository from './_database-base-repository';
import QueryOrderRepository from './queries/query-order-repository';

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

  async findOne(params: FindByIdOrderDto) {
    return this.prisma.order.findFirst({
      where: this.queryOrderRepository.handleWhere(params),
      select: {
        ...this.queryOrderRepository.handleSelect(params?.columns),
        ...this.queryOrderRepository.handleInclude(params?.with),
      },
    });
  }

  store(data: StoreOrderDto) {
    const { items, total, paymentReference, paymentMethod, meta, ...orderData } = data;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderNumber: generateOrderNumber(),
          paymentMethod,
          meta,
          orderItems: { create: items },
        },
        include: { orderItems: { include: { product: true } } },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          method: paymentMethod,
          reference: paymentReference,
          status: PaymentStatus.COMPLETED,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED },
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
          throw new Error(`Stok produk ID ${item.productId} tidak mencukupi.`);
        }
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: { include: { product: true } }, payments: true },
      }) as Promise<Record<string, any>>;
    });
  }

  update(data: UpdateOrderStatusDto) {
    const { id, ...updateData } = data;
    return this.prisma.order.update({ where: { id }, data: updateData });
  }

  async cancelOrder(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, status: { not: OrderStatus.CANCELLED } },
        include: { orderItems: true, payments: true },
      });

      if (!order) return;

      for (const item of order.orderItems) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { status: PaymentStatus.REFUNDED },
      });

      return tx.order.updateMany({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });
  }
}
