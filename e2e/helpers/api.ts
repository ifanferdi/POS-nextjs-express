import { APIRequestContext } from "@playwright/test";

/** POST /v1/auth/sign-in → { message, token, refreshToken?, exp, user }. */
export async function signIn(
  request: APIRequestContext,
  username: string,
  password: string,
) {
  const res = await request.post("v1/auth/sign-in", { data: { username, password } });
  return { status: res.status(), body: await res.json().catch(() => ({})) };
}

export const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Ambil roleId berdasarkan nama role (seed tidak menjamin id tetap). */
export async function getRoleIdByName(request: APIRequestContext, token: string, name: string) {
  const res = await request.get("v1/roles", { headers: authHeaders(token) });
  const body = await res.json();
  const role = (body.data ?? []).find((r: { name: string }) => r.name === name);
  return role?.id;
}
