import config from '@/config/config';
import { createS3SignatureKey, reformatStorageKey } from '@/helpers/common.helper';
import { ErrorBadRequest } from '@/helpers/error.helper';
import fs from 'node:fs';
import path from 'node:path';

const STORAGE_ROOT = path.resolve(process.cwd(), config.storage.localDir);
const APP_URL = config.app.url;

export default class LocalStorageRepository {
  private isPathInside(root: string, candidate: string) {
    const relativePath = path.relative(root, candidate);
    return (
      relativePath === '' ||
      (relativePath !== '..' &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath))
    );
  }

  private resolveLexically(key: string) {
    const normalizedKey = reformatStorageKey(key);
    const filePath = path.resolve(STORAGE_ROOT, normalizedKey);

    if (filePath === STORAGE_ROOT || !this.isPathInside(STORAGE_ROOT, filePath))
      throw new ErrorBadRequest('File tidak valid.');

    return path.relative(STORAGE_ROOT, filePath).split(path.sep).join('/');
  }

  private async resolvePath(key: string, createParents = false) {
    const normalizedKey = this.resolveLexically(key);
    if (createParents) await fs.promises.mkdir(STORAGE_ROOT, { recursive: true });

    const root = await fs.promises.realpath(STORAGE_ROOT);
    const filePath = path.resolve(root, normalizedKey);
    if (filePath === root || !this.isPathInside(root, filePath))
      throw new ErrorBadRequest('File tidak valid.');

    const relativePath = path.relative(root, filePath);
    const directories = relativePath.split(path.sep).slice(0, -1);
    let parentPath = root;

    for (const directory of directories) {
      const nextPath = path.join(parentPath, directory);

      if (createParents) {
        try {
          await fs.promises.mkdir(nextPath);
        } catch (error) {
          if (!this.hasErrorCode(error, 'EEXIST')) throw error;
        }
      }

      const stats = await fs.promises.lstat(nextPath);
      if (stats.isSymbolicLink() || !stats.isDirectory())
        throw new ErrorBadRequest('File tidak valid.');

      parentPath = await fs.promises.realpath(nextPath);
      if (!this.isPathInside(root, parentPath)) throw new ErrorBadRequest('File tidak valid.');
    }

    return { root, filePath: path.join(parentPath, path.basename(filePath)) };
  }

  private hasErrorCode(error: unknown, code: string) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
  }

  private async resolveExistingPath(key: string) {
    const { root, filePath } = await this.resolvePath(key);
    const stats = await fs.promises.lstat(filePath);
    if (stats.isSymbolicLink()) throw new ErrorBadRequest('File tidak valid.');

    const realPath = await fs.promises.realpath(filePath);
    if (!this.isPathInside(root, realPath)) throw new ErrorBadRequest('File tidak valid.');

    return realPath;
  }

  async put(file: Buffer, key: string) {
    const { root, filePath } = await this.resolvePath(key, true);
    let targetPath = filePath;

    try {
      const stats = await fs.promises.lstat(filePath);
      if (stats.isSymbolicLink()) throw new ErrorBadRequest('File tidak valid.');

      targetPath = await fs.promises.realpath(filePath);
      if (!this.isPathInside(root, targetPath)) throw new ErrorBadRequest('File tidak valid.');
    } catch (error) {
      if (!this.hasErrorCode(error, 'ENOENT')) throw error;
    }

    const fileHandle = await fs.promises.open(
      targetPath,
      fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW,
    );

    try {
      await fileHandle.writeFile(file);
    } finally {
      await fileHandle.close();
    }
  }

  async move(oldPath: string, newPath: string) {
    try {
      const sourcePath = await this.resolveExistingPath(oldPath);
      const { root, filePath: targetPath } = await this.resolvePath(newPath, true);

      try {
        const stats = await fs.promises.lstat(targetPath);
        if (stats.isSymbolicLink()) throw new ErrorBadRequest('File tidak valid.');

        const realTargetPath = await fs.promises.realpath(targetPath);
        if (!this.isPathInside(root, realTargetPath))
          throw new ErrorBadRequest('File tidak valid.');
      } catch (error) {
        if (!this.hasErrorCode(error, 'ENOENT')) throw error;
      }

      await fs.promises.rename(sourcePath, targetPath);
    } catch {
      throw new ErrorBadRequest('File tidak valid.');
    }
  }

  async delete(path: string) {
    let filePath: string;

    try {
      filePath = await this.resolveExistingPath(path);
    } catch (error) {
      if (error instanceof ErrorBadRequest) throw error;
      console.log(error);
      return;
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.log(error);
    }
  }

  async isExist(path: string) {
    try {
      await this.resolveExistingPath(path);
      return true;
    } catch {
      return false;
    }
  }

  async getRawUrl(path: string) {
    const normalizedPath = this.resolveLexically(path);

    try {
      await this.resolveExistingPath(normalizedPath);
    } catch (error) {
      if (!this.hasErrorCode(error, 'ENOENT')) throw error;
    }

    const encodedPath = normalizedPath.split('/').map(encodeURIComponent).join('/');

    return `${APP_URL}/${config.storage.localDir}/${encodedPath}`;
  }

  async getUrl(path: string, expiresInSeconds = config.storage.expiredTime) {
    const normalizedPath = this.resolveLexically(path);

    try {
      await this.resolveExistingPath(normalizedPath);
    } catch (error) {
      if (!this.hasErrorCode(error, 'ENOENT')) throw error;
    }

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = createS3SignatureKey(normalizedPath, expires);
    const encodedPath = normalizedPath.split('/').map(encodeURIComponent).join('/');

    return `${APP_URL}/public/files/${encodedPath}?expires=${expires}&sig=${signature}`;
  }
}
