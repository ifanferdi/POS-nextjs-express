import express from 'express';
import Authorization from '../../../use-cases/auth/authorization';
import PermissionController from '../controller/permission-controller';

export default function PermissionRoutes(controller: PermissionController, auth: Authorization) {
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

  router.use(auth.authorize('Show Permission'), showRoutes);
  router.use(auth.authorize('Manage Permission'), manageRoutes);

  router.post('/check-valid-permissions', controller.checkValidPermission);

  return router;
}
