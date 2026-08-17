import { AuthUseCase } from '@/domain/use-cases/auth.interface';
import { CommonUseCase } from '@/domain/use-cases/common.interface';
import { OrderUseCase } from '@/domain/use-cases/order.interface';
import { PaymentUseCase } from '@/domain/use-cases/payment.interface';
import { PermissionUseCase } from '@/domain/use-cases/permission.interface';
import { CategoryUseCase } from '@/domain/use-cases/category.interface';
import { ProductUseCase } from '@/domain/use-cases/product.interface';
import { RoleUseCase } from '@/domain/use-cases/role.interface';
import { UserUseCase } from '@/domain/use-cases/user.interface';

export interface UseCases {
  userUseCase: UserUseCase;
  authUseCase: AuthUseCase;
  permissionUseCase: PermissionUseCase;
  roleUseCase: RoleUseCase;
  commonUseCase: CommonUseCase;
  categoryUseCase: CategoryUseCase;
  productUseCase: ProductUseCase;
  orderUseCase: OrderUseCase;
  paymentUseCase: PaymentUseCase;
}
