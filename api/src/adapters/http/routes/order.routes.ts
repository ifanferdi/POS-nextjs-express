import express from 'express';
import Authorization from '@/use-cases/auth/authorization';
import OrderController from '@/adapters/http/controller/order-controller';

export default function OrderRoutes(controller: OrderController, auth: Authorization) {
  const router = express.Router();

  const showRoutes = express
    .Router()
    .post('/get', controller.findAll)
    .get('/', controller.findAll)
    .get('/:id', controller.findOne);

  const manageRoutes = express
    .Router()
    .post('/', controller.create)
    .put('/:id/status', controller.updateStatus)
    .post('/:id/cancel', controller.cancel);

  router.use(auth.authorize(['Show Order']), showRoutes);
  router.use(auth.authorize(['Manage Order']), manageRoutes);

  return router;
}
