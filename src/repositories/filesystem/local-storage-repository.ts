import crypto from 'crypto';
import fs from 'fs';
import { dirname as getDirName } from 'path';
import config from '../../config/config';
import { reformatStorageKey } from '../../helpers/common.helper';
import { ErrorBadRequest } from '../../helpers/error.helper';

const STORAGE_DIR = config.storage.localDir;
const APP_URL = config.app.url;

export default class LocalStorageRepository {
  private async makeDir(path: string) {
    await fs.promises.mkdir(getDirName(path), { recursive: true });
  }

  async put(file: Buffer, key: string) {
    await this.makeDir(`${STORAGE_DIR}/${reformatStorageKey(key)}`);
    await fs.promises.writeFile(`${STORAGE_DIR}/${reformatStorageKey(key)}`, file);
  }

  async move(oldPath: string, newPath: string) {
    try {
      await this.makeDir(`${STORAGE_DIR}/${newPath}`);
      await fs.promises.rename(`${STORAGE_DIR}/${oldPath}`, `${STORAGE_DIR}/${newPath}`);
    } catch (err) {
      throw new ErrorBadRequest('File tidak valid.');
    }
  }

  async delete(path: string) {
    try {
      await fs.promises.unlink(`${STORAGE_DIR}/${path}`);
    } catch (err) {
      console.log(err);
    }
  }

  async isExist(path: string) {
    try {
      await fs.promises.access(`${STORAGE_DIR}/${path}`, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  getRawUrl(path: string) {
    return `${APP_URL}/${STORAGE_DIR}/${path}`;
  }

  getUrl(
    path: string,
    expiresInSeconds = config.storage.expiredTime, // 5 menit
  ) {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', config.storage.storageSecret)
      .update(`${path}:${expires}`)
      .digest('hex');

    return `${APP_URL}/public/files/${path}?expires=${expires}&sig=${signature}`;
  }
}
