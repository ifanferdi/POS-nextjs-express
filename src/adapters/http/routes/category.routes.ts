import express from 'express';
import Authorization from '../../../use-cases/auth/authorization';
import CategoryController from '../controller/category-controller';

export default function CategoryRoutes(
  controller: CategoryController,
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

  router.use(auth.authorize(['Show Category']), showRoutes);
  router.use(auth.authorize(['Manage Category']), manageRoutes);

  return router;
}