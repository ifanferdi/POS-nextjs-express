import CancelOrder from '../../use-cases/order/cancel-order';
import CreateOrder from '../../use-cases/order/create-order';
import FindAllOrder from '../../use-cases/order/find-all-order';
import FindByIdOrder from '../../use-cases/order/find-by-id-order';
import UpdateOrderStatus from '../../use-cases/order/update-order-status';

export interface OrderUseCase {
  findAllOrder: FindAllOrder;
  findByIdOrder: FindByIdOrder;
  createOrder: CreateOrder;
  updateOrderStatus: UpdateOrderStatus;
  cancelOrder: CancelOrder;
}
