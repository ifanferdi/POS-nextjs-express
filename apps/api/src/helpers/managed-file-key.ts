import { ErrorBadRequest } from '@/helpers/error.helper';

const MANAGED_PREFIXES = ['products/', 'profiles/'] as const;

export function assertManagedFileKey(
  key: string,
  prefix?: 'products' | 'profiles',
): void {
  if (
    typeof key !== 'string' ||
    key.length > 1024 ||
    !MANAGED_PREFIXES.some((managedPrefix) => key.startsWith(managedPrefix)) ||
    (prefix !== undefined && !key.startsWith(`${prefix}/`)) ||
    /[%\\?#\u0000-\u001f\u007f]/.test(key) ||
    key.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new ErrorBadRequest('File key is invalid.');
  }
}
