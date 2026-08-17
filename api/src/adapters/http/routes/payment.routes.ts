import express from 'express';
import Authorization from '@/use-cases/auth/authorization';
import PaymentController from '@/adapters/http/controller/payment-controller';

export default function PaymentRoutes(controller: PaymentController, auth: Authorization) {
  const router = express.Router();

  const showRoutes = express
    .Router()
    .post('/get', controller.findAll)
    .get('/', controller.findAll)
    .get('/:id', controller.findOne);

  const manageRoutes = express.Router().post('/', controller.create);

  router.use(auth.authorize(['Show Payment']), showRoutes);
  router.use(auth.authorize(['Manage Payment']), manageRoutes);

  return router;
}
