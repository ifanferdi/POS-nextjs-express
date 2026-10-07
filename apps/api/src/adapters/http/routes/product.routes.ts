import express from 'express';
import Authorization from '@/use-cases/auth/authorization';
import ProductController from '@/adapters/http/controller/product-controller';

export default function ProductRoutes(controller: ProductController, auth: Authorization) {
  const router = express.Router();

  const showRoutes = express
    .Router()
    .post('/get', controller.findAll)
    .get('/', controller.findAll)
    .get('/:id', controller.findOne);

  const manageRoutes = express
    .Router()
    .post('/', controller.create)
    .put('/:id', controller.update)
    .delete('/:id', controller.destroy)
    .delete('/:id/permanently', controller.destroyPermanently)
    .post('/:id/restore', controller.restore)
    .post('/upload', controller.upload, controller.uploadImage);

  router.use(auth.authorize(['Show Product']), showRoutes);
  router.use(auth.authorize(['Manage Product']), manageRoutes);

  return router;
}
