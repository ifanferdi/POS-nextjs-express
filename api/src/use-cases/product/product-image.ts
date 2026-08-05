import { reformatStorageKey } from '../../helpers/common.helper';
import BaseUseCase from '../_base-use-case';

export default class ProductImage extends BaseUseCase {
  async execute(image: Express.Multer.File) {
    const fileName = reformatStorageKey(
      `products/${Date.now()}-${image.originalname}`.replace(/\s/g, '-'),
    );

    await this.repositories.storageRepository?.put(image.buffer, fileName);

    return fileName;
  }
}
