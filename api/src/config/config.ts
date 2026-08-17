import 'dotenv/config';
import authConfig from '@/config/auth.config';
import databaseConfig from '@/config/database.config';
import storageConfig from '@/config/storage.config';

const APP_PORT = process.env.APP_PORT || 3000;
const config = {
  app: {
    name: process.env.APP_NAME || 'ExpressJS Typescript',
    version: process.env.APP_VERSION || '1.0.0',
    env: (process.env.APP_ENV || 'development') as 'development' | 'staging' | 'production',
    port: APP_PORT,
    url: process.env.APP_URL || `http://localhost:${APP_PORT}`,
  },
  database: databaseConfig,
  auth: authConfig,
  storage: storageConfig,
  grpc: {
    port: process.env.GRPC_PORT || 50051,
  },
  api: {
    timeout: Number(process.env.AXIOS_TIMEOUT) || 30000,
    services: {
      scheduleServiceUrl: process.env.SCHEDULE_SERVICE_URL as string,
      // add other service
    },
  },
  secret: process.env.HASH_SECRET || 'zN6p9JfG@!Xc7vR2Ls$wq04Mb',
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'exchange',
  },
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
    apiKey: process.env.ELASTICSEARCH_API_KEY || '',
    index: 'auth-user-index',
  },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  filesystem: (process.env.FILESYSTEM || 'local') as 's3' | 'local',
  smtp: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};

export default config;
