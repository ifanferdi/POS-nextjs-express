import { ErrorBadRequest } from '@/helpers/error.helper';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UpdateProductDto } from '@/validations/product-validation';

export default class UpdateProduct extends BaseUseCase {
  async execute(payload: UpdateProductDto) {
    if (payload.sku) await this.checkUniqueSku(payload.sku, payload.id);
    if (payload.barcode) await this.checkUniqueBarcode(payload.barcode, payload.id);

    const product = await this.repositories.productRepository.update(payload);

    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'update',
      data: [product],
    });

    return product;
  }

  private async checkUniqueSku(sku: string, notId: number) {
    const count = await this.repositories.productRepository.count({ sku, notId });
    if (count > 0) throw new ErrorBadRequest('SKU telah digunakan.');
  }

  private async checkUniqueBarcode(barcode: string, notId: number) {
    const count = await this.repositories.productRepository.count({ barcode, notId });
    if (count > 0) throw new ErrorBadRequest('Barcode telah digunakan.');
  }
}
