import crypto from 'crypto';
import e from 'express';
import config from '../../../config/config';
import { HttpStatusCode } from '../../../constants/http-status.constant';

export function verifySignedUrl(
  req: e.Request & Record<string, any>,
  res: e.Response,
  next: e.NextFunction,
) {
  const { expires, sig } = req.query;
  const filePath = req.params[0]; // wildcard path

  if (!expires || !sig) {
    return res.status(HttpStatusCode.FORBIDDEN).send('Invalid signature');
  }

  if (Date.now() / 1000 > Number(expires)) {
    return res.status(HttpStatusCode.GONE).send('URL expired');
  }

  const expectedSig = crypto
    .createHmac('sha256', config.storage.storageSecret!)
    .update(`${filePath}:${expires}`)
    .digest('hex');

  if (sig !== expectedSig) {
    return res.status(HttpStatusCode.FORBIDDEN).send('Invalid signature');
  }

  req.filePath = filePath;
  next();
}
