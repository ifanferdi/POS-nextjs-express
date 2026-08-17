import { IProduct } from '../../domain/entities/models/product';
import { isLink } from '../../helpers/common.helper';
import paginate from '../../helpers/paginate.helper';
import { FindAllProductDto } from '../../validations/product-validation';
import BaseUseCase from '../_base-use-case';

export default class FindAllProduct extends BaseUseCase {
  async execute(params: FindAllProductDto) {
    const { page = 1, limit = 10 } = params;

    const data = (await this.repositories.productRepository.findAll(params)) as IProduct[];
    const total = await this.repositories.productRepository.count(params);

    this.extractCategories(data);
    await Promise.all(data.map((product) => this.handleProductImageUrl(product)));

    return paginate({ page, limit, total, data });
  }

  private extractCategories(products: IProduct[]) {
    products.forEach((product) => {
      if (product.productHasCategories) {
        product.categories = product.productHasCategories.map((phc) => phc.category!);
        delete product.productHasCategories;
      }
    });
  }

  private async handleProductImageUrl(product: IProduct) {
    if (product.imagePath)
      product.imageUrl = isLink(product.imagePath)
        ? product.imagePath
        : await this.repositories.storageRepository?.getUrl(product.imagePath);
  }
}
