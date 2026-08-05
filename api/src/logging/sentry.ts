import * as Sentry from '@sentry/node';
import { Express, NextFunction, Request, Response } from 'express';
import config from '../config/config';

const NODE_ENV = config?.app.env;
export default class UseSentry {
  constructor(private readonly app: Express) {}

  initialize() {
    Sentry.init({
      dsn: config.sentry.dsn,

      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app: this.app }),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
    });

    // The request queries must be the first middleware on the app
    this.app.use(Sentry.Handlers.requestHandler());

    // TracingHandler creates a trace for every incoming request
    this.app.use(Sentry.Handlers.tracingHandler());
  }

  writeErrorLogs() {
    // The error queries must be registered before any other error middleware and after all controllers
    this.app.use(
      Sentry.Handlers.errorHandler({
        shouldHandleError(_error) {
          return true;
        },
      }),
    );

    // Optional fallthrough error queries
    this.app.use(function onError(
      err: any,
      _req: Request,
      res: Response & Record<string, any>,
      _next: NextFunction,
    ) {
      res.statusCode = err.statusCode || 500;
      let data: Record<string, any> = { message: err?.message };

      if (NODE_ENV === 'development') {
        data.sentry = res?.sentry;
        data.stack = err?.stack;
      }

      return res.json(data);
    });
  }
}
