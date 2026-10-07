import PaymentController from '@/adapters/http/controller/payment-controller';
import Authorization from '@/use-cases/auth/authorization';
import express from 'express';

export default function PaymentRoutes(controller: PaymentController, auth: Authorization) {
  const router = express.Router();

  const showRoutes = express
    .Router()
    .post('/get', controller.findAll)
    .get('/', controller.findAll)
    .get('/:id', controller.findOne)
    .get('/:orderId/order', controller.findOneByOrderId);

  router.use(auth.authorize(['Show Payment']), showRoutes);

  return router;
}
