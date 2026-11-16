import Routes from '@/adapters/http/routes';
import ErrorHandler from '@/adapters/http/webserver/error-handler';
import ExtractJwtToken from '@/adapters/http/webserver/extract-jwt-token';
import RouteNotFoundHandler from '@/adapters/http/webserver/route-not-found-handler';
import { verifySignedUrl } from '@/adapters/http/webserver/verify-signed-url';
import config from '@/config/config';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { Controllers } from '@/domain/adapters/controller.interface';
import { UseCases } from '@/domain/use-cases/use-case.interface';
import cors from 'cors';
import { default as express, Express } from 'express';
import asyncHandler from 'express-async-handler';
import helmet from 'helmet';
import morgan from 'morgan';
import { readFileSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

const isPathInside = (root: string, candidate: string) => {
  const relativePath = path.relative(root, candidate);
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
};

export default function routes(app: Express, controllers: Controllers, useCases: UseCases) {
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.disable('x-powered-by');
  if (config.app.env === 'development') app.use(morgan('dev'));

  app.use(cors({ origin: ['http://localhost:3000', ...config.cors.origins], credentials: true }));

  // SWAGGER UI — hanya di luar produksi (kontrak API tidak perlu publik).
  if (config.app.env !== 'production') {
    const swaggerDocument = parse(
      readFileSync(path.join(__dirname, '../../../../docs/openapi.yaml'), 'utf8'),
    );
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  // API INDEX
  app.get('/', (_req, res) => {
    res.json({
      name: config.app.name,
      version: config.app.version,
      docs: '/docs',
    });
  });

  // CHECK & EXTRACT JWT TOKEN
  app.use(ExtractJwtToken(useCases));

  // PUBLIC ROUTE STORAGE
  if (config.filesystem.toLowerCase() === 'local') {
    const storageRoot = path.resolve(process.cwd(), config.storage.localDir);

    app.get(
      '/public/files/*',
      verifySignedUrl,
      asyncHandler(async (req, res) => {
        const fullPath = path.resolve(storageRoot, req.params[0]);
        if (!isPathInside(storageRoot, fullPath)) {
          res.status(HttpStatusCode.NOT_FOUND).end();
          return;
        }

        try {
          const [realStorageRoot, realFilePath] = await Promise.all([
            realpath(storageRoot),
            realpath(fullPath),
          ]);

          if (!isPathInside(realStorageRoot, realFilePath)) {
            res.status(HttpStatusCode.NOT_FOUND).end();
            return;
          }

          res.sendFile(realFilePath, (err) => {
            if (err) res.status(HttpStatusCode.NOT_FOUND).end();
          });
        } catch {
          res.status(HttpStatusCode.NOT_FOUND).end();
        }
      }),
    );
  }

  Routes(app, controllers, useCases.authUseCase.authorization);

  app.all('*', RouteNotFoundHandler);

  app.use(ErrorHandler);
}
