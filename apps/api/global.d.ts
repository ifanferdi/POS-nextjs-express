declare namespace NodeJS {
  interface ProcessEnv {
    APP_NAME: string;
    APP_ENV: 'development' | 'staging' | 'production';
    APP_PORT: string;
    APP_URL: string;

    DB_USER: string;
    DB_PASS: string;
    DB_NAME: string;
    DB_HOST: string;
    DB_PORT: string;

    GRPC_PORT: number;

    AXIOS_TIMEOUT: number;
    PROJECT_SERVICE_URL: string;

    HASH_SECRET: string;

    AUTH_MODE: 'stateless' | 'stateful';
    AUTH_USE_2FA: 'true' | 'false';
    AUTH_TOKEN_TIMEOUT: string | number;
    AUTH_REFRESH_TOKEN_TIMEOUT: string | number;
    AUTH_OTP_TIMEOUT: string | number;
    AUTH_OTP_TIMEOUT_LABEL: string;
    AUTH_OTP_RATE_LIMIT_NUM: number;
    AUTH_OTP_RATE_LIMIT_TIME: string | number;
    AUTH_NEED_2FA_AFTER_MINUTES: number;

    RABBITMQ_URL: string;
    RABBITMQ_EXCHANGE: string;

    ELASTICSEARCH_HOST: string;
    ELASTICSEARCH_API_KEY: string;

    REDIS_URL: string;

    FILESYSTEM: 's3' | 'local';
    S3_REGION: string;
    S3_ACCESS: string;
    S3_SECRET: string;
    S3_ENDPOINT: string;
    S3_BUCKET: string;

    SMTP_USER: string;
    SMTP_PASS: string;

    SENTRY_DSN: string;
  }
}
