import CreateProduct from '@/use-cases/product/create-product';
import DeleteProduct from '@/use-cases/product/delete-product';
import FindAllProduct from '@/use-cases/product/find-all-product';
import FindByIdProduct from '@/use-cases/product/find-by-id-product';
import ProductImage from '@/use-cases/product/product-image';
import RestoreProduct from '@/use-cases/product/restore-product';
import UpdateProduct from '@/use-cases/product/update-product';

export interface ProductUseCase {
  findAllProduct: FindAllProduct;
  findByIdProduct: FindByIdProduct;
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
  restoreProduct: RestoreProduct;
  productImage: ProductImage;
}
