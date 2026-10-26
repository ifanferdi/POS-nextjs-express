import { beforeEach, describe, expect, it } from 'bun:test';
// import config from 'src/config/config';
import config from '../../src/config/config';
import { IUser } from '../../src/domain/entities/models/user';
import { ttl } from '../../src/helpers/common.helper';
import * as jwt from '../../src/helpers/jwt.helper';
import CheckToken from '../../src/use-cases/auth/check-token';
import RefreshToken from '../../src/use-cases/auth/refresh-token';
import SignIn from '../../src/use-cases/auth/sign-in';
import SignOut from '../../src/use-cases/auth/sign-out';

const user = { id: 1, username: 'tester', isActive: true } as IUser;

const sessions = new Map<string, any>();
let lastExpired = 0;

const repositories = {
  redisRepository: {
    store: async ({ key, value, expired }: any) => {
      sessions.set(key, value);
      lastExpired = expired;
    },
    findOne: async (key: string) => sessions.get(key) ?? null,
    destroy: async (key: string) => void sessions.delete(key),
    getExpireInSecond: async () => -1,
  },
  userRepository: { findOne: async () => user },
} as any;

const signIn = new SignIn(repositories);
const refresh = new RefreshToken(repositories);
const checkToken = new CheckToken(repositories);
const signOut = new SignOut(repositories);

const sessionIdOf = (token: string) => jwt.verify(token).sessionId!;

describe('auth session (stateful)', () => {
  beforeEach(() => sessions.clear());

  it('memisahkan session per login (1 akun banyak device)', async () => {
    const first = await signIn.handleStatefulMode(user);
    const second = await signIn.handleStatefulMode(user);

    expect(sessions.size).toBe(2);
    expect(sessionIdOf(first.token)).not.toBe(sessionIdOf(second.token));
    expect(first.refreshToken).not.toBe(second.refreshToken);
  });

  it('menyimpan hash refresh token, bukan token mentah atau access token', async () => {
    const session = await signIn.handleStatefulMode(user);
    const stored = sessions.get(jwt.key(sessionIdOf(session.token)));

    expect(stored.refreshTokenHash).not.toBe(session.refreshToken);
    expect(stored.refreshTokenHash).toHaveLength(64);
    expect(stored.token).toBeUndefined();
    expect(lastExpired).toBe(ttl(config.auth.refreshTokenTimeout));
  });

  it('merotasi refresh token tanpa mengganggu session lain', async () => {
    const first = await signIn.handleStatefulMode(user);
    const second = await signIn.handleStatefulMode(user);

    const rotated = await refresh.execute({ token: first.refreshToken });
    expect(rotated.refreshToken).not.toBe(first.refreshToken);

    // refresh token lama sudah mati
    expect(refresh.execute({ token: first.refreshToken })).rejects.toThrow();

    // session device lain masih hidup
    expect(refresh.execute({ token: second.refreshToken })).resolves.toBeDefined();
  });

  it('check-token cukup validasi JWT, tapi menolak refresh token sebagai access token', async () => {
    const session = await signIn.handleStatefulMode(user);

    expect((await checkToken.execute({ token: session.token })).id).toBe(user.id);

    expect(checkToken.execute({ token: session.refreshToken })).rejects.toThrow();
  });

  it('sign-out hanya mematikan session yang sedang dipakai', async () => {
    const first = await signIn.handleStatefulMode(user);
    const second = await signIn.handleStatefulMode(user);

    await signOut.execute({ sessionId: sessionIdOf(first.token) });

    expect(sessions.size).toBe(1);
    expect(refresh.execute({ token: first.refreshToken })).rejects.toThrow();
    expect(refresh.execute({ token: second.refreshToken })).resolves.toBeDefined();
  });
});
