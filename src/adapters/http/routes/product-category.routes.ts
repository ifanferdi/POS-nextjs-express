import express from 'express';
import Authorization from '../../../use-cases/auth/authorization';
import ProductCategoryController from '../controller/product-category-controller';

export default function ProductCategoryRoutes(
  controller: ProductCategoryController,
  auth: Authorization,
) {
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
    .delete('/:id', controller.destroy);

  router.use(auth.authorize(['Show Product Category']), showRoutes);
  router.use(auth.authorize(['Manage Product Category']), manageRoutes);

  return router;
}
