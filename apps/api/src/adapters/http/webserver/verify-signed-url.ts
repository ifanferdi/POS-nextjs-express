import { HttpStatusCode } from '@/constants/http-status.constant';
import { createS3SignatureKey } from '@/helpers/common.helper';
import e from 'express';
import { timingSafeEqual } from 'node:crypto';

export function verifySignedUrl(
  req: e.Request & Record<string, any>,
  res: e.Response,
  next: e.NextFunction,
) {
  const { expires, sig } = req.query;
  const filePath = req.params[0]; // wildcard path

  if (
    typeof expires !== 'string' ||
    !/^\d+$/.test(expires) ||
    !Number.isSafeInteger(Number(expires)) ||
    typeof sig !== 'string' ||
    !/^[a-f\d]{64}$/.test(sig)
  ) {
    return res.status(HttpStatusCode.FORBIDDEN).send('Invalid signature');
  }

  const expiry = Number(expires);
  if (expiry <= Date.now() / 1000) {
    return res.status(HttpStatusCode.GONE).send('URL expired');
  }

  const expectedSig = createS3SignatureKey(filePath, expiry);

  if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return res.status(HttpStatusCode.FORBIDDEN).send('Invalid signature');
  }

  req.filePath = filePath;
  next();
}
