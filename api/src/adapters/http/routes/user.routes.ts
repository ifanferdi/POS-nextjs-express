import UserController from '@/adapters/http/controller/user-controller';
import Authorization from '@/use-cases/auth/authorization';
import express from 'express';

export default function UserRoutes(controller: UserController, auth: Authorization) {
  const router = express.Router();

  router.get('/me', controller.myAccount);
  router.put('/me', controller.updateMyAccount);

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
    .post('/:id/restore', controller.restore);

  router.use(auth.authorize(['Show User']), showRoutes);
  router.use(auth.authorize(['Manage User', 'Manage Self']), manageRoutes);

  return router;
}
