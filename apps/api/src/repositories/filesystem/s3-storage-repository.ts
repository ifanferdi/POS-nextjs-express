import config from '@/config/config';
import { ErrorBadRequest } from '@/helpers/error.helper';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as mime from 'mime-types';
import path from 'node:path';

const BUCKET_NAME = config.storage.s3.bucket;
const { region, accessKeyId, secretAccessKey, endpoint, publicEndpoint, forcePathStyle } =
  config.storage.s3;

export default class S3StorageRepository {
  private s3Client?: S3Client;
  private s3PublicClient?: S3Client;

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

  private getPublicClient() {
    if (!this.s3PublicClient) {
      this.s3PublicClient = new S3Client({
        forcePathStyle,
        region,
        credentials: {
          accessKeyId: accessKeyId || 'minioadmin',
          secretAccessKey: secretAccessKey || 'minioadmin',
        },
        endpoint: publicEndpoint || endpoint,
        requestChecksumCalculation: 'WHEN_REQUIRED',
      });
    }

    return this.s3PublicClient;
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

  async getUrl(path: string, expiresIn = config.storage.expiredTime) {
    const options: GetObjectCommandInput = { Bucket: BUCKET_NAME, Key: path };
    // if (path.includes('.pdf')) {
    //   options.ResponseContentDisposition = 'inline'; // override
    //   options.ResponseContentType = 'application/pdf';
    // }

    return await getSignedUrl(this.getPublicClient(), new GetObjectCommand(options), {
      expiresIn /** seconds */,
    });
  }

  async getPresignUrl(key: string, size: number, expiresIn = config.storage.expiredTime) {
    const command: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mime.contentType(path.basename(key)) || undefined,
      ContentLength: size,
    };

    return await getSignedUrl(this.getPublicClient(), new PutObjectCommand(command), {
      expiresIn /** seconds */,
    });
  }
}
