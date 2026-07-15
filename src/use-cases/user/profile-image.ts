import config from '../../config/config';
import { reformatStorageKey } from '../../helpers/common.helper';
import BaseUseCase from '../_base-use-case';

export default class ProfileImage extends BaseUseCase {
  async execute(image: Express.Multer.File) {
    const fileName = reformatStorageKey(
      `${config.storage.tempDir}/${Date.now()}-${image.originalname}`,
    );

    await this.repositories.storageRepository?.put(image.buffer, fileName);

    return fileName;
  }
}
