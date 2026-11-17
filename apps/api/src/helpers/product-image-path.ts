import config from '@/config/config';
import { assertManagedFileKey } from '@/helpers/managed-file-key';
import { ErrorBadRequest } from '@/helpers/error.helper';

export type ProductImagePathKind = 'managed' | 'external';

function parseUrl(value: string | undefined) {
  if (!value) return undefined;

  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

const configuredEndpoints = [
  config.app.url,
  config.storage.s3.endpoint,
  config.storage.s3.publicEndpoint,
]
  .map(parseUrl)
  .filter((url): url is URL => url !== undefined);
const internalOrigins = new Set(configuredEndpoints.map((url) => url.origin));
const internalHostnames = new Set(
  configuredEndpoints.map((url) => url.hostname.toLowerCase().replace(/\.$/, '')),
);

function isLoopbackHostname(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '');

  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host === '0.0.0.0' ||
    /^127\./.test(host)
  );
}

const AMAZON_S3_HOSTNAME = /^s3(?:[.-][a-z0-9-]+)*\.amazonaws\.com(?:\.cn)?$/;

function isConfiguredAmazonS3Url(url: URL, pathname: string) {
  const bucket = (config.storage.s3.bucket || '').toLowerCase();
  if (!bucket) return false;

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  return (
    (hostname.startsWith(`${bucket}.`) &&
      AMAZON_S3_HOSTNAME.test(hostname.slice(bucket.length + 1))) ||
    (AMAZON_S3_HOSTNAME.test(hostname) &&
      (pathname === `/${bucket}` || pathname.startsWith(`/${bucket}/`)))
  );
}


export function assertProductImagePath(path: string): ProductImagePathKind {
  if (/^https?:\/\//i.test(path)) {
    let url: URL;
    try {
      url = new URL(path);
    } catch {
      throw new ErrorBadRequest('Product image must be a products/ key or a third-party HTTP(S) URL.');
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      throw new ErrorBadRequest('Product image must be a products/ key or a third-party HTTP(S) URL.');
    }

    const isConfiguredEndpoint =
      internalHostnames.has(hostname) &&
      (!isLoopbackHostname(hostname) || internalOrigins.has(url.origin));
    if (
      path !== path.trim() ||
      !hostname ||
      !(url.protocol === 'http:' || url.protocol === 'https:') ||
      url.username !== '' ||
      url.password !== '' ||
      isConfiguredEndpoint ||
      isConfiguredAmazonS3Url(url, pathname) ||
      /^\/public\/files(?:\/|$)/.test(pathname)
    )
      throw new ErrorBadRequest('Product image must be a products/ key or a third-party HTTP(S) URL.');

    return 'external';
  }

  assertManagedFileKey(path, 'products');
  return 'managed';
}
