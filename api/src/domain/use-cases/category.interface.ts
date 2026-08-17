import CreateCategory from '@/use-cases/category/create-category';
import DeleteCategory from '@/use-cases/category/delete-category';
import FindAllCategory from '@/use-cases/category/find-all-category';
import FindByIdCategory from '@/use-cases/category/find-by-id-category';
import UpdateCategory from '@/use-cases/category/update-category';

export interface CategoryUseCase {
  findAllCategory: FindAllCategory;
  findByIdCategory: FindByIdCategory;
  createCategory: CreateCategory;
  updateCategory: UpdateCategory;
  deleteCategory: DeleteCategory;
}