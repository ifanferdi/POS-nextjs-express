import { UseCases } from '@/domain/use-cases/use-case.interface';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import e from 'express';
import asyncHandler from 'express-async-handler';

// Webhook midtrans dicocokkan exact: /webhooks/midtrans/mock TIDAK boleh ikut
// whitelist (wajib JWT + Manage Order). /public/files dicocokkan prefix karena
// path-nya wildcard.
const EXACT_WHITE_LIST = [
  '/api/v1/auth/sign-in',
  '/api/v1/auth/refresh-token',
  '/api/v1/webhooks/midtrans',
];
const PREFIX_WHITE_LIST = ['/public/files'];
export default (useCases: UseCases) =>
  asyncHandler(
    async (req: e.Request & Record<string, any>, _res: e.Response, next: e.NextFunction) => {
      const isWhitelisted =
        EXACT_WHITE_LIST.includes(req.path) ||
        PREFIX_WHITE_LIST.some((route) => req.path.startsWith(route));
      if (isWhitelisted) return next();

      const bearerToken = req.headers.authorization;

      if (!bearerToken)
        return next(new ErrorUnauthorized('Authorization header with Bearer token is required.'));
      else {
        if (!bearerToken?.startsWith('Bearer'))
          return next(new ErrorUnauthorized('Authorization header must use bearer scheme.'));

        const token = bearerToken.replace('Bearer ', '');
        if (token === '' || token === 'Bearer')
          return next(new ErrorUnauthorized('Bearer token is required.'));

        const tokenData = await useCases.authUseCase.checkToken.execute({ token });

        req.headers.userId = String(tokenData.id);
        req.user = tokenData;
      }
      next();
    },
  );
