import config from '@/config/config';
import { ErrorBadRequest } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { UploadDto } from '@/validations/storage.validation';
import { randomUUID } from 'crypto';

export default class GeneratePresignUrl extends BaseUseCase {
  async execute(body: UploadDto) {
    const ext = body.filename.split('.').pop();
    const folder = body.folder ?? body.fileType;
    const key = `${folder}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;

    const expiresIn = config.storage.expiredTime;
    const storageRepository = this.repositories.storageRepository;
    if (!('getPresignUrl' in storageRepository))
      throw new ErrorBadRequest('Presigned uploads are only supported by S3 storage.');

    const presignUrl = await storageRepository.getPresignUrl(key, body.fileSize);

    return { key, presignUrl, expiresIn };
  }
}
