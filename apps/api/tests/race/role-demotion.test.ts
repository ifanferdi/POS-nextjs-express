import { afterAll, beforeAll, expect, it } from 'bun:test';
import './env';
import { cachePermissions, login, resetAll, seedUser } from './fixtures';
import { baseUrl, closeHarness } from './harness';

const { prismaNonLogger: db } = await import('@/infrastructure/database/prisma/prisma');
const { CreateRedisConnection } = await import('@/infrastructure/redis/redis-connection');
const { getRedisKeyPermissions } = await import('@/helpers/common.helper');

let demotedUser = { id: 0, username: '' };
let demotedToken = '';
let developerToken = '';
let staffRoleId = 0;

beforeAll(async () => {
  await resetAll();

  const manageUser = await db.permission.create({ data: { name: 'Manage User' } });
  const showUser = await db.permission.create({ data: { name: 'Show User' } });
  const manageRole = await db.permission.create({ data: { name: 'Manage Role' } });
  const showRole = await db.permission.create({ data: { name: 'Show Role' } });
  await db.permission.create({ data: { name: 'Manage Permission' } });
  const developerRole = await db.role.create({ data: { name: 'Developer' } });
  const staffRole = await db.role.create({ data: { name: 'Staff' } });
  expect(developerRole.id).toBe(1);
  expect(staffRole.id).toBe(2);
  staffRoleId = staffRole.id;

  await db.roleHasPermission.createMany({
    data: [
      { roleId: developerRole.id, permissionId: manageUser.id },
      { roleId: developerRole.id, permissionId: showUser.id },
      { roleId: staffRole.id, permissionId: manageRole.id },
      { roleId: staffRole.id, permissionId: showRole.id },
    ],
  });

  const administrator = await seedUser('role-demotion-admin', developerRole.id);
  demotedUser = await seedUser('role-demotion-target', developerRole.id);
  await cachePermissions([administrator.id], ['Show User', 'Manage User']);
  await cachePermissions([demotedUser.id], ['Manage Permission']);

  developerToken = await login(administrator.username);
  demotedToken = await login(demotedUser.username);
});

afterAll(closeHarness);

it('uses the current role from the database for an already-issued token', async () => {
  const demotionResponse = await fetch(`${baseUrl()}/api/v1/users/${demotedUser.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${developerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: demotedUser.username, isActive: true, roleId: staffRoleId }),
  });

  expect(demotionResponse.status).toBe(200);

  const redis = CreateRedisConnection();
  await redis.connect();
  try {
    expect(await redis.get(getRedisKeyPermissions(demotedUser.id))).toBeNull();
  } finally {
    await redis.quit();
  }

  const assignmentResponse = await fetch(`${baseUrl()}/api/v1/roles/assign-permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${demotedToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roleId: staffRoleId, addPermissions: ['Manage Permission'] }),
  });

  expect(assignmentResponse.status).toBe(403);
});
