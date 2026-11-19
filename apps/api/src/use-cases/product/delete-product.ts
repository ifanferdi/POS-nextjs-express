import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { IProduct } from '@/domain/entities/models/product';
import { assertProductImagePath } from '@/helpers/product-image-path';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { BaseFindById } from '@/validations/base-validation';

export default class DeleteProduct extends BaseUseCase {
  async execute({ id }: BaseFindById, options?: { isPermanently: boolean }) {
    const product = await this.repositories.productRepository.findOne<IProduct>({
      id,
      with: options?.isPermanently ? [ProductRelation.SOFT_DELETE] : undefined,
    });
    const imagePath = product?.imagePath;
    const imagePathKind =
      imagePath === undefined || imagePath === null
        ? undefined
        : assertProductImagePath(imagePath);

    const destroy = options?.isPermanently
      ? product
        ? await this.repositories.productRepository.deletePermanently(id)
        : undefined
      : await this.repositories.productRepository.destroy(id);

    if (
      options?.isPermanently &&
      imagePathKind === 'managed' &&
      imagePath !== undefined &&
      imagePath !== null
    )
      await this.repositories.storageRepository.delete(imagePath);

    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'delete',
      data: [{ id }],
    });

    return destroy;
  }
}
