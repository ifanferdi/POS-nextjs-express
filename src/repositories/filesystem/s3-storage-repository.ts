import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as mime from 'mime-types';
import path from 'node:path';
import config from '../../config/config';
import { ErrorBadRequest } from '../../helpers/error.helper';

const BUCKET_NAME = config.storage.s3.bucket;
const { region, accessKeyId, secretAccessKey, endpoint, forcePathStyle } = config.storage.s3;

export default class S3StorageRepository {
  private s3Client?: S3Client;

  private getClient() {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        forcePathStyle,
        region,
        credentials: { accessKeyId, secretAccessKey },
        endpoint,
      });
    }

    return this.s3Client;
  }

  async put(file: Buffer, key: string) {
    return await this.getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Body: file,
        Key: key,
        ContentType: mime.contentType(path.basename(key)) || undefined,
      }),
    );
  }

  async move(oldPath: string, newPath: string) {
    try {
      await this.getClient().send(
        new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${oldPath}`,
          Key: newPath,
        }),
      );

      await this.delete(oldPath);
    } catch (err: any) {
      if (err.Code === 'NoSuchKey') {
        throw new ErrorBadRequest('File tidak valid.');
      } else {
        throw err;
      }
    }
  }

  async delete(path: string) {
    try {
      await this.getClient().send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: path }));
    } catch (err) {
      console.error('Error deleting file directory', err);
    }
  }

  async isExist(path: string) {
    try {
      await this.getClient().send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: path }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUrl(path: string) {
    const options: GetObjectCommandInput = { Bucket: BUCKET_NAME, Key: path };
    // if (path.includes('.pdf')) {
    //   options.ResponseContentDisposition = 'inline'; // override
    //   options.ResponseContentType = 'application/pdf';
    // }

    return await getSignedUrl(this.getClient(), new GetObjectCommand(options), {
      expiresIn: config.storage.expiredTime,
    });
  }
}
