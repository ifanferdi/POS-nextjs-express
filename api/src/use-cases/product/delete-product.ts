import { ProductRelation } from '../../domain/entities/enums/product.enum';
import { BaseFindById } from '../../validations/base-validation';
import BaseUseCase from '../_base-use-case';

export default class DeleteProduct extends BaseUseCase {
  execute({ id }: BaseFindById, options?: { isPermanently: boolean }) {
    if (options?.isPermanently)
      return this.handleDeletePermanently(id);

    return this.repositories.productRepository.destroy(id);
  }

  private async handleDeletePermanently(id: number) {
    const product = await this.repositories.productRepository.findOne({
      id,
      with: [ProductRelation.SOFT_DELETE],
    } as any);
    if (!product) return;

    const result = await this.repositories.productRepository.deletePermanently(id);

    if ((product as any).imagePath)
      await this.repositories.storageRepository?.delete((product as any).imagePath);

    return result;
  }
}
