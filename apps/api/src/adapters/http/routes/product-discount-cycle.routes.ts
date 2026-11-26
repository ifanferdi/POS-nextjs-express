import ProductDiscountCycleController from '@/adapters/http/controller/product-discount-cycle-controller';
import Authorization from '@/use-cases/auth/authorization';
import express from 'express';

export default function ProductDiscountCycleRoutes(
  controller: ProductDiscountCycleController,
  auth: Authorization,
) {
  const router = express.Router();

  const showRoutes = express
    .Router()
    .post('/get', controller.findAll)
    .post('/check-quota', controller.checkQuota)
    .get('/', controller.findAll)
    .get('/:id', controller.findOne);

  const manageRoutes = express
    .Router()
    .post('/', controller.create)
    .put('/:id', controller.update)
    .delete('/:id', controller.destroy);

  router.use(auth.authorize(['Show Product Discount Cycle']), showRoutes);
  router.use(auth.authorize(['Manage Product Discount Cycle']), manageRoutes);

  return router;
}
