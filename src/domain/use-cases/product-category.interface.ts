import CreateProductCategory from '../../use-cases/product-category/create-product-category';
import DeleteProductCategory from '../../use-cases/product-category/delete-product-category';
import FindAllProductCategory from '../../use-cases/product-category/find-all-product-category';
import FindByIdProductCategory from '../../use-cases/product-category/find-by-id-product-category';
import UpdateProductCategory from '../../use-cases/product-category/update-product-category';

export interface ProductCategoryUseCase {
  findAllProductCategory: FindAllProductCategory;
  findByIdProductCategory: FindByIdProductCategory;
  createProductCategory: CreateProductCategory;
  updateProductCategory: UpdateProductCategory;
  deleteProductCategory: DeleteProductCategory;
}
