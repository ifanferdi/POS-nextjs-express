import 'dotenv/config';
import express, { Express } from 'express';
import * as http from 'http';
import bootstrap from './bootstrap';
import config from './config/config';

const PORT = config.app.port || 8000;

(async () => {
  const app: Express = express();
  const httpServer = http.createServer(app);

  await bootstrap(app, httpServer);
  console.log('✅  Success connected to all resources.');

  httpServer.listen(PORT, () => console.log(`✅  Listening on port: ${PORT}`));
})();
