import express from 'express';
import Authorization from '@/use-cases/auth/authorization';
import RoleController from '@/adapters/http/controller/role-controller';

export default function RoleRoutes(controller: RoleController, auth: Authorization) {
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

  router.use(auth.authorize('Show Role'), showRoutes);
  router.use(auth.authorize('Manage Role'), manageRoutes);

  router.post('/assign-permissions', controller.assignPermissions);

  return router;
}
