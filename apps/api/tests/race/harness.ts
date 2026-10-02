import { setDefaultTimeout } from 'bun:test';
import express from 'express';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import './env';

// Race scenarios fire hundreds of requests against a pool of 3; the default 5s is too tight.
setDefaultTimeout(180_000);

// Dynamic import: guarantees env.ts runs before bootstrap/config is evaluated, regardless of how
// prettier's organize-imports plugin orders static imports.
const { default: bootstrap } = await import('@/bootstrap');

const app = express();
await bootstrap(app);
console.log('✅  Success connected to all resources.');

const server = http.createServer(app);
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = (server.address() as AddressInfo).port;

export function baseUrl() {
  return `http://127.0.0.1:${port}`;
}

export async function closeHarness() {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

export { app, port, server };
