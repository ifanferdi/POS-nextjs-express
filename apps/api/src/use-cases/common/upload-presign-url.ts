import { UploadEntity } from '@/domain/entities/types/storage.types';
import config from '@/config/config';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UploadDto } from '@/validations/storage.validation';
import { randomUUID } from 'crypto';
import { assertManagedFileKey } from '@/helpers/managed-file-key';

const FILE_EXTENSIONS: Record<UploadDto['contentType'], string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'video/mp4': 'mp4',
};

export default class GeneratePresignUrl extends BaseUseCase {
  async execute(body: UploadDto) {
    const ext = FILE_EXTENSIONS[body.contentType];
    const key = `${body.folder}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;
    const prefix = body.folder === UploadEntity.PRODUCTS ? 'products' : 'profiles';
    assertManagedFileKey(key, prefix);

    const expiresIn = config.storage.expiredTime;
    const presignUrl = await this.repositories.storageRepository?.getPresignUrl(key, body.fileSize);

    return { key, presignUrl, expiresIn };
  }
}
