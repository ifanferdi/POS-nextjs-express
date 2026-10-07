import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteProduct extends BaseUseCase {
  async execute({ id }: BaseFindById, options?: { isPermanently: boolean }) {
    let destroy;
    if (options?.isPermanently) destroy = this.handleDeletePermanently(id);

    destroy = this.repositories.productRepository.destroy(id);

    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'delete',
      data: [{ id }],
    });

    return destroy;
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
