import { OrderRelation, OrderStatus } from '../../domain/entities/enums/order.enum';
import BaseUseCase from '../_base-use-case';

export default class PosDashboard extends BaseUseCase {
  async execute() {
    const [totalProducts, totalOrdersToday, totalRevenueToday, recentOrders] = await Promise.all([
      this.repositories.productRepository.count({}),
      this.countOrdersToday(),
      this.sumRevenueToday(),
      this.getRecentOrders(),
    ]);

    return {
      totalProducts,
      totalOrdersToday,
      totalRevenueToday,
      recentOrders,
    };
  }

  private async countOrdersToday() {
    return this.repositories.orderRepository.count({ createdAtDay: new Date() });
  }

  private async sumRevenueToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await this.repositories.orderRepository.findAll({
      limit: -1,
      orderBy: [],
      createdAtDay: new Date(),
    });

    const completeOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);

    return completeOrders.reduce((sum: number, o) => sum + (o.total || 0), 0);
  }

  private async getRecentOrders() {
    return this.repositories.orderRepository.findAll({
      page: 1,
      limit: 5,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      with: [OrderRelation.CUSTOMER, OrderRelation.ORDER_ITEMS],
    });
  }
}
