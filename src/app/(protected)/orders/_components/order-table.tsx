import { OrderTable } from '@/app/(protected)/orders/_components/order-data-table';
import { TablePagination } from '@/components/shared/table';
import { OrderList } from '@/domain';
import { getAllOrders } from '@/features/orders/api';
import { GetAllOrderParams } from '@/features/orders/schema';

interface OrderTableSectionProps {
  params: GetAllOrderParams;
}
export async function OrderTableSection(props: OrderTableSectionProps) {
  const { params } = props;
  const { data: orders, ...meta } = await getAllOrders<OrderList>(params);
  return (
    <>
      <OrderTable orders={orders} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/orders"
      />
    </>
  );
}
