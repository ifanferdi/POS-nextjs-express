import { describe, expect, it } from 'bun:test';
import express, { type Express } from 'express';
import AppController from '../../src/adapters/http/controller/app-controller';
import AuthController from '../../src/adapters/http/controller/auth-controller';
import CategoryController from '../../src/adapters/http/controller/category-controller';
import MidtransController from '../../src/adapters/http/controller/midtrans-controller';
import OrderController from '../../src/adapters/http/controller/order-controller';
import RoleController from '../../src/adapters/http/controller/role-controller';
import UserController from '../../src/adapters/http/controller/user-controller';
import Routes from '../../src/adapters/http/routes';
import type { Controllers } from '../../src/domain/adapters/controller.interface';
import type { UseCases } from '../../src/domain/use-cases/use-case.interface';
import type Authorization from '../../src/use-cases/auth/authorization';
import { FindByIdCategorySchema } from '../../src/validations/category-validation';
import { DashboardQuerySchema } from '../../src/validations/dashboard-validation';
import { RoleAssignPermissionSchema } from '../../src/validations/role-validation';

const useCases = (parts: Record<string, unknown>) => parts as unknown as UseCases;

async function withServer(app: Express, check: (origin: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No bound TCP port');
    await check(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function app() {
  const result = express();
  result.use(express.json());
  return result;
}

function post(origin: string, path: string, body: unknown) {
  return fetch(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('request strings parsed by Zod', () => {
  it('passes trimmed category values to the use case and rejects blank names', async () => {
    const received: unknown[] = [];
    const controller = new CategoryController(
      useCases({
        categoryUseCase: {
          createCategory: {
            execute: async (payload: unknown) => {
              received.push(payload);
              return payload;
            },
          },
        },
      }),
    );
    const server = app();
    server.post('/categories', controller.create);
    server.use(
      (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
        res.status(400).json({ error: error.message }),
    );

    await withServer(server, async (origin) => {
      const valid = await post(origin, '/categories', {
        name: '  Kopi susu  ',
        description: '  contoh  ',
      });
      expect(valid.status).toBe(201);
      expect(received).toEqual([{ name: 'Kopi susu', description: 'contoh' }]);
      const invalid = await post(origin, '/categories', { name: ' \t ' });
      expect(invalid.status).toBe(400);
      expect(received).toHaveLength(1);
    });
  });

  it('uses parsed credentials, refresh tokens and updated passwords', async () => {
    let signIn: unknown;
    let refresh: unknown;
    let updated: unknown[] = [];
    const auth = new AuthController(
      useCases({
        authUseCase: {
          signIn: {
            execute: async (params: unknown) => {
              signIn = params;
              return { token: 'ok' };
            },
          },
          refreshToken: {
            execute: async (params: unknown) => {
              refresh = params;
              return { token: 'ok' };
            },
          },
        },
      }),
    );
    const user = new UserController(
      useCases({
        userUseCase: {
          findByIdUser: { execute: async () => ({ id: 7 }) },
          updateUser: {
            execute: async (...args: unknown[]) => {
              updated = args;
              return { id: 7 };
            },
          },
        },
      }),
    );
    const server = app();
    server.use((req, _res, next) => {
      (req as express.Request & { user: { id: number; roleId: number } }).user = {
        id: 5,
        roleId: 3,
      };
      next();
    });
    server.post('/sign-in', auth.signIn);
    server.post('/refresh-token', auth.refreshToken);
    server.put('/users/:id', user.update);
    server.use(
      (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
        res.status(400).json({ error: error.message }),
    );

    await withServer(server, async (origin) => {
      expect(
        (await post(origin, '/sign-in', { username: '  alice  ', password: '  long-secret  ' }))
          .status,
      ).toBe(200);
      expect(signIn).toMatchObject({ username: 'alice', password: 'long-secret' });
      expect(signIn).toMatchObject({ ipAddress: expect.any(String) });
      expect(
        (await post(origin, '/refresh-token', { refreshToken: '  signed-token  ' })).status,
      ).toBe(200);
      expect(refresh).toEqual({ token: 'signed-token' });
      const response = await fetch(`${origin}/users/7`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: '  alice  ',
          isActive: true,
          roleId: 2,
          password: '  new-secret  ',
          confirmPassword: '  new-secret  ',
          oldPassword: '  old-secret  ',
        }),
      });
      expect(response.status).toBe(200);
      expect(updated[0]).toMatchObject({ id: 7, username: 'alice', isActive: true, roleId: 2 });
      expect(updated[1]).toEqual({
        password: 'new-secret',
        confirmPassword: 'new-secret',
        oldPassword: 'old-secret',
      });
      expect(updated[2]).toBe(3);
    });
  });

  it('parses a supplied user profile before creating the user', async () => {
    let created: unknown;
    const user = new UserController(
      useCases({
        userUseCase: {
          createUser: {
            execute: async (payload: unknown) => {
              created = payload;
              return { id: 1 };
            },
          },
        },
      }),
    );
    const server = app();
    server.post('/users', user.create);
    await withServer(server, async (origin) => {
      const response = await post(origin, '/users', {
        username: ' alice ',
        password: ' password123 ',
        confirmPassword: ' password123 ',
        roleId: 2,
        profile: {
          fullName: ' Alice ',
          placeOfBirth: ' Jakarta ',
          dateOfBirth: ' 2000-01-01 ',
          gender: ' female ',
        },
      });
      expect(response.status).toBe(201);
      expect(created).toMatchObject({
        username: 'alice',
        password: 'password123',
        roleId: 2,
        profile: {
          fullName: 'Alice',
          placeOfBirth: 'Jakarta',
          dateOfBirth: '2000-01-01',
          gender: 'female',
          age: expect.any(Number),
        },
      });
    });
  });

  it('trims validated array elements, dates, and enums without accepting unknown values', () => {
    expect(FindByIdCategorySchema.parse({ id: 1, with: [' products '] }).with).toEqual([
      'products',
    ]);
    expect(
      DashboardQuerySchema.parse({ from: ' 2026-01-01 ', granularity: ' day ' }),
    ).toMatchObject({ from: '2026-01-01', granularity: 'day' });
    expect(DashboardQuerySchema.safeParse({ granularity: ' yesterday ' }).success).toBe(false);
    expect(
      RoleAssignPermissionSchema.parse({ roleId: 1, permissions: [' Manage Product '] })
        .permissions,
    ).toEqual(['Manage Product']);
  });

  it('preserves the authenticated actor when assigning trimmed permissions', async () => {
    let assigned: unknown;
    const role = new RoleController(
      useCases({
        roleUseCase: {
          findByIdRole: { execute: async () => ({ id: 2 }) },
          roleAssignPermission: {
            execute: async (params: unknown) => {
              assigned = params;
              return [];
            },
          },
        },
      }),
    );
    const server = app();
    server.use((req, _res, next) => {
      (req as express.Request & { user: { roleId: number } }).user = { roleId: 3 };
      next();
    });
    server.post('/assign', role.assignPermissions);
    await withServer(server, async (origin) => {
      const response = await post(origin, '/assign', {
        roleId: 2,
        actorRoleId: 99,
        permissions: [' Manage Product '],
      });
      expect(response.status).toBe(200);
      expect(assigned).toMatchObject({
        roleId: 2,
        actorRoleId: 3,
        permissions: ['Manage Product'],
      });
    });
  });

  it('checks normalized product folders before presigning', async () => {
    const received: unknown[] = [];
    let allowed = false;
    const appController = new AppController(
      useCases({
        commonUseCase: {
          generatePresignUrl: {
            execute: async (payload: unknown) => {
              received.push(payload);
              return { key: 'ok' };
            },
          },
        },
      }),
    );
    const handler = (_req: express.Request, res: express.Response) => res.sendStatus(204);
    const controllers = new Proxy(
      { appController },
      {
        get(target, name) {
          if (name === 'appController') return target.appController;
          return new Proxy({}, { get: () => handler });
        },
      },
    ) as Controllers;
    const auth = {
      authorize:
        (permissions: string[]) =>
        (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
          if (permissions.includes('Manage Product') && !allowed)
            return next(Object.assign(new Error('Forbidden'), { status: 403 }));
          next();
        },
    } as Authorization;
    const server = express();
    server.use(express.json());
    Routes(server, controllers, auth);
    server.use(
      (
        error: Error & { status?: number },
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => res.status(error.status ?? 400).json({ error: error.message }),
    );
    const payload = {
      folder: ' products ',
      filename: ' x.png ',
      fileType: ' image ',
      contentType: ' image/png ',
      fileSize: 1,
    };

    await withServer(server, async (origin) => {
      expect((await post(origin, '/api/v1/uploads/generate-presign-url', payload)).status).toBe(
        403,
      );
      expect(received).toHaveLength(0);
      allowed = true;
      expect((await post(origin, '/api/v1/uploads/generate-presign-url', payload)).status).toBe(
        200,
      );
      expect(received).toEqual([
        {
          folder: 'products',
          filename: 'x.png',
          fileType: 'image',
          contentType: 'image/png',
          fileSize: 1,
        },
      ]);
    });
  });

  it('retains authorization scope and leaves signed Midtrans notifications exact', async () => {
    let found: unknown;
    let synced: unknown;
    const order = new OrderController(
      useCases({
        orderUseCase: {
          authorizationOrder: {
            all: async (params: object, actorId: number) => ({
              ...params,
              userId: actorId,
              accessScope: 'only-mine',
            }),
          },
          findAllOrder: {
            execute: async (params: unknown) => {
              found = params;
              return [];
            },
          },
        },
      }),
    );
    const midtrans = new MidtransController(
      useCases({
        midtransUseCase: {
          syncMidtransToDatabase: {
            execute: async (params: unknown) => {
              synced = params;
            },
          },
        },
      }),
    );
    const server = express();
    server.use(express.json());
    server.use((req, _res, next) => {
      (req as express.Request & { user: { id: number } }).user = { id: 9 };
      next();
    });
    server.get('/orders', order.findAll);
    server.post('/midtrans', midtrans.webhook);
    server.use(
      (error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) =>
        res.status(400).json({ error: error.message }),
    );
    await withServer(server, async (origin) => {
      expect((await fetch(`${origin}/orders?q=%20%20espresso%20%20`)).status).toBe(200);
      expect(found).toMatchObject({ search: 'espresso', userId: 9, accessScope: 'only-mine' });
      const notification = {
        order_id: ' order-1 ',
        signature_key: ' signature ',
        transaction_status: 'settlement',
      };
      expect((await post(origin, '/midtrans', notification)).status).toBe(200);
      expect(synced).toEqual({ orderNumber: ' order-1 ', notification });
    });
  });
});
