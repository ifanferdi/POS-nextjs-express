import { UseCases } from '@/domain/use-cases/use-case.interface';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import e from 'express';
import asyncHandler from 'express-async-handler';

const EXACT_WHITE_LIST = [
  '/api/v1/auth/sign-in',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/refresh-token',
  '/api/v1/webhooks/midtrans',
];
export default (useCases: UseCases) =>
  asyncHandler(
    async (req: e.Request & Record<string, any>, _res: e.Response, next: e.NextFunction) => {
      if (EXACT_WHITE_LIST.includes(req.path)) return next();

      const bearerToken = req.headers.authorization;

      if (!bearerToken)
        return next(new ErrorUnauthorized('Authorization header with Bearer token is required.'));
      else {
        if (!bearerToken?.startsWith('Bearer'))
          return next(new ErrorUnauthorized('Authorization header must use bearer scheme.'));

        const token = bearerToken.replace('Bearer ', '');
        if (token === '' || token === 'Bearer')
          return next(new ErrorUnauthorized('Bearer token is required.'));

        const tokenData = await useCases.authUseCase.checkToken.execute({
          token,
        });

        req.headers.userId = String(tokenData.id);
        req.user = tokenData;
      }
      next();
    },
  );
