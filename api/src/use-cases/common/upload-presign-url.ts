import config from '@/config/config';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UploadDto } from '@/validations/storage.validation';
import { randomUUID } from 'crypto';

export default class GeneratePresignUrl extends BaseUseCase {
  async execute(body: UploadDto) {
    const ext = body.filename.split('.').pop();
    const key = `${body.fileType}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

    const expiresIn = config.storage.expiredTime;
    const presignUrl = await this.repositories.storageRepository?.getPresignUrl(key, );

    return { key, presignUrl, expiresIn };
  }
}
