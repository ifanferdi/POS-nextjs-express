import { AuthUseCase } from './auth.interface';
import { CommonUseCase } from './common.interface';
import { OrderUseCase } from './order.interface';
import { PaymentUseCase } from './payment.interface';
import { PermissionUseCase } from './permission.interface';
import { ProductCategoryUseCase } from './product-category.interface';
import { ProductUseCase } from './product.interface';
import { RoleUseCase } from './role.interface';
import { UserUseCase } from './user.interface';

export interface UseCases {
  userUseCase: UserUseCase;
  authUseCase: AuthUseCase;
  permissionUseCase: PermissionUseCase;
  roleUseCase: RoleUseCase;
  commonUseCase: CommonUseCase;
  productCategoryUseCase: ProductCategoryUseCase;
  productUseCase: ProductUseCase;
  orderUseCase: OrderUseCase;
  paymentUseCase: PaymentUseCase;
}
