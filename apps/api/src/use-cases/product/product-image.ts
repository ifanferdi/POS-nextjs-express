import { randomUUID } from 'node:crypto';
import { ErrorBadRequest } from '@/helpers/error.helper';
import { assertManagedFileKey } from '@/helpers/managed-file-key';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class ProductImage extends BaseUseCase {
  async execute(image?: Express.Multer.File) {
    if (!image) throw new ErrorBadRequest('Image file is required.');

    const extension = image.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `products/${randomUUID()}.${extension}`;
    assertManagedFileKey(key, 'products');

    await this.repositories.storageRepository.put(image.buffer, key);

    return key;
  }
}
