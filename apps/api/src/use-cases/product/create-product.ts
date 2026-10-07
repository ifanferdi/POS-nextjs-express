import { ErrorBadRequest } from '@/helpers/error.helper';
import { publishSSEEvent } from '@/infrastructure/event-stream/sse-redis-bridge';
import BaseUseCase from '@/use-cases/_base-use-case';
import { CreateProductDto } from '@/validations/product-validation';

export default class CreateProduct extends BaseUseCase {
  async execute(payload: CreateProductDto) {
    if (payload.sku) await this.checkUniqueSku(payload.sku);
    if (payload.barcode) await this.checkUniqueBarcode(payload.barcode);

    const product = await this.repositories.productRepository.store(payload);

    await publishSSEEvent({
      scope: 'product',
      entity: 'product',
      action: 'create',
      data: [product],
    });

    return product;
  }

  private async checkUniqueSku(sku: string) {
    const count = await this.repositories.productRepository.count({ sku });
    if (count > 0) throw new ErrorBadRequest('SKU telah digunakan.');
  }

  private async checkUniqueBarcode(barcode: string) {
    const count = await this.repositories.productRepository.count({ barcode });
    if (count > 0) throw new ErrorBadRequest('Barcode telah digunakan.');
  }
}
