import { HttpStatusCode } from '@/constants/http-status.constant';
import { extractUserId } from '@/helpers/common.helper';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import Authorization from '@/use-cases/auth/authorization';
import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import SseController from '../controller/sse-controller';

export default function SseRoutes(controller: SseController, auth: Authorization) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response, next) => {
      const userId = extractUserId(req);
      if (!userId) {
        next(new ErrorUnauthorized('User identity is missing from the request.'));
        return;
      }

      const canReadOrders = await auth.hasPermission(userId, 'Show Order');
      const canReadProducts = await auth.hasPermission(userId, 'Show Product');

      if (!canReadOrders && !canReadProducts) {
        res.status(HttpStatusCode.FORBIDDEN).json({
          message: "You don't have the permission to access this resource!",
        });
        return;
      }

      res.locals.sseAccess = {
        canReadOrders,
        canReadProducts,
        canReadAllOrders: canReadOrders && !(await auth.hasRole(userId, 'User')),
      };

      next();
    }),
    controller.sseHandler,
  );

  return router;
}
