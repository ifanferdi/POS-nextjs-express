// Must be evaluated before any module under `src/` is imported (config is read at import time).
process.env.APP_ENV = 'development';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = '1234';
process.env.DB_NAME = 'expressjs_race_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.REDIS_URL = 'redis://localhost:6379/2';
process.env.AUTH_MODE = 'stateful';
process.env.FILESYSTEM = 'local';
process.env.HASH_SECRET = process.env.HASH_SECRET || 'race-test-hash-secret';
process.env.STORAGE_SECRET = process.env.STORAGE_SECRET || 'race-test-storage-secret';
// MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY are intentionally NOT set here: pass-through from the
// machine env (or .env) so sandbox charges work without hardcoding credentials in the repo.

export const RACE_DB_NAME = process.env.DB_NAME;
export const RACE_REDIS_URL = process.env.REDIS_URL;
