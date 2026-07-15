import cors from 'cors';
import { default as express, Express } from 'express';
import morgan from 'morgan';
import path from 'node:path';
import config from '../../../config/config';
import { HttpStatusCode } from '../../../constants/http-status.constant';
import { Controllers } from '../../../domain/adapters/controller.interface';
import { UseCases } from '../../../domain/use-cases/use-case.interface';
import Routes from '../routes';
import ErrorHandler from './error-handler';
import ExtractJwtToken from './extract-jwt-token';
import RouteNotFoundHandler from './route-not-found-handler';
import { verifySignedUrl } from './verify-signed-url';

export default function routes(app: Express, controllers: Controllers, useCases: UseCases) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

  // CHECK & EXTRACT JWT TOKEN
  app.use(ExtractJwtToken(useCases));

  // PUBLIC ROUTE STORAGE
  if (config.filesystem.toLowerCase() === 'local') {
    app.get('/public/files/*', verifySignedUrl, (req, res) => {
      const filePath = req.params[0];

      const fullPath = path.join(process.cwd(), 'storage/public', filePath);

      res.sendFile(fullPath, (err) => {
        if (err) res.status(HttpStatusCode.NOT_FOUND).end();
      });
    });
  }

  Routes(app, controllers, useCases.authUseCase.authorization);

  app.all('*', RouteNotFoundHandler);

  app.use(ErrorHandler);
}
