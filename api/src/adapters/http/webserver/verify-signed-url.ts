import { HttpStatusCode } from '@/constants/http-status.constant';
import { createS3SignatureKey } from '@/helpers/common.helper';
import e from 'express';

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

  const expectedSig = createS3SignatureKey(filePath, Number(expires));

  if (sig !== expectedSig) {
    return res.status(HttpStatusCode.FORBIDDEN).send('Invalid signature');
  }

  req.filePath = filePath;
  next();
}
