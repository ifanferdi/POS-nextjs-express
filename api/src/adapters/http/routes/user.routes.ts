import express from 'express';
import Authorization from '@/use-cases/auth/authorization';
import UserController from '@/adapters/http/controller/user-controller';

export default function UserRoutes(controller: UserController, auth: Authorization) {
  const router = express.Router();

  router.get('/my-account', controller.myAccount);

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
    .post('/profile/upload', controller.upload, controller.uploadImage);

  router.use(auth.authorize(['Show User', 'Show Trainee']), showRoutes);
  router.use(auth.authorize(['Manage User', 'Manage Trainee']), manageRoutes);

  return router;
}
