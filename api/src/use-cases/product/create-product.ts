import { ErrorBadRequest } from '../../helpers/error.helper';
import { CreateProductDto } from '../../validations/product-validation';
import BaseUseCase from '../_base-use-case';

export default class CreateProduct extends BaseUseCase {
  async execute(payload: CreateProductDto) {
    if (payload.sku) await this.checkUniqueSku(payload.sku);
    if (payload.barcode) await this.checkUniqueBarcode(payload.barcode);

    return this.repositories.productRepository.store(payload);
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
