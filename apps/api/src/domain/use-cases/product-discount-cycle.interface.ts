import CheckQuotaProductDiscountCycle from '@/use-cases/product-discount-cycle/check-quota-product-discount-cycle';
import CreateProductDiscountCycle from '@/use-cases/product-discount-cycle/create-product-discount-cycle';
import DeleteProductDiscountCycle from '@/use-cases/product-discount-cycle/delete-product-discount-cycle';
import FindAllProductDiscountCycle from '@/use-cases/product-discount-cycle/find-all-product-discount-cycle';
import FindByIdProductDiscountCycle from '@/use-cases/product-discount-cycle/find-by-id-product-discount-cycle';
import UpdateProductDiscountCycle from '@/use-cases/product-discount-cycle/update-product-discount-cycle';

export interface InvalidDiscountQuota {
  productId: number;
  itemLeft: number;
}

export type CheckQuotaProductDiscountCycleResult =
  | { valid: true }
  | { valid: false; invalid: InvalidDiscountQuota[] };

export interface ProductDiscountCycleUseCase {
  findAllProductDiscountCycle: FindAllProductDiscountCycle;
  findByIdProductDiscountCycle: FindByIdProductDiscountCycle;
  createProductDiscountCycle: CreateProductDiscountCycle;
  updateProductDiscountCycle: UpdateProductDiscountCycle;
  deleteProductDiscountCycle: DeleteProductDiscountCycle;
  checkQuotaProductDiscountCycle: CheckQuotaProductDiscountCycle;
}
