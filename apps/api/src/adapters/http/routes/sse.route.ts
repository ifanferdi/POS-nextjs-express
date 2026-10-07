import Authorization from '@/use-cases/auth/authorization';
import express from 'express';
import SseController from '../controller/sse-controller';

export default function SseRoutes(controller: SseController, auth: Authorization) {
  const router = express.Router();

  router.get('/', controller.sseHandler);

  return router;
}
