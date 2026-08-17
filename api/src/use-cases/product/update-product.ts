import { ErrorBadRequest } from '@/helpers/error.helper';
import { UpdateProductDto } from '@/validations/product-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class UpdateProduct extends BaseUseCase {
  async execute(payload: UpdateProductDto) {
    if (payload.sku) await this.checkUniqueSku(payload.sku, payload.id);
    if (payload.barcode) await this.checkUniqueBarcode(payload.barcode, payload.id);

    return this.repositories.productRepository.update(payload);
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
