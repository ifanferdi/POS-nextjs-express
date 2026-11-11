import { expect, test } from "@playwright/test";
import { authHeaders, signIn } from "../../helpers/api";

test.describe("api: auth endpoints", () => {
  test("sign-in sukses mengembalikan token + user (admin)", async ({ request }) => {
    const { status, body } = await signIn(request, "admin", "password");
    expect(status).toBe(200);
    expect(body.message).toBe("Success");
    expect(body.token).toBeTruthy();
    expect(body.user).toBeTruthy();
    expect(body.user.username).toBe("admin");
  });

  test("sign-in dengan password salah → 400", async ({ request }) => {
    const { status, body } = await signIn(request, "admin", "salah-password-e2e");
    expect(status).toBe(400);
    expect(body.message).toContain("tidak valid");
  });

  test("sign-in user tidak dikenal → 400", async ({ request }) => {
    const { status } = await signIn(request, "tidak-ada-user-ini", "password");
    expect(status).toBe(400);
  });

  test("tanpa Authorization header → 401", async ({ request }) => {
    const res = await request.get("v1/users/me");
    expect(res.status()).toBe(401);
  });

  test("prefix lowercase 'bearer' → 401", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/users/me", {
      headers: { Authorization: `bearer ${body.token}` },
    });
    expect(res.status()).toBe(401);
  });

  test("token rusak/forged → 401 (fix #14)", async ({ request }) => {
    // Sebelumnya JsonWebTokenError bocor sebagai 500; sekarang 401.
    // Perhatian: gagal sampai PR terdeploy (produksi masih 500).
    const res = await request.get("v1/users/me", {
      headers: { Authorization: "Bearer ini.bukan.jwt" },
    });
    expect(res.status()).toBe(401);
  });

  test("refresh-token: rotasi & token lama invalid (stateful)", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    test.skip(!body.refreshToken, "Mode stateless: refresh token tidak diterbitkan");

    // Refresh pertama → token + refreshToken baru.
    const first = await request.post("v1/auth/refresh-token", {
      data: { refreshToken: body.refreshToken },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.token).toBeTruthy();
    expect(firstBody.token).not.toBe(body.token);
    expect(firstBody.refreshToken).toBeTruthy();
    expect(firstBody.refreshToken).not.toBe(body.refreshToken);

    // Refresh token lama (sudah dirotasi) → harus ditolak.
    const reuse = await request.post("v1/auth/refresh-token", {
      data: { refreshToken: body.refreshToken },
    });
    expect(reuse.status()).toBeGreaterThanOrEqual(400);
  });

  test("sign-out mencabut akses token (stateful — fix #18)", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const out = await request.post("v1/auth/sign-out", {
      headers: authHeaders(body.token),
    });
    expect(out.status()).toBe(200);

    // Perhatian: gagal sampai PR terdeploy (token lama masih berlaku sampai exp).
    const reuse = await request.get("v1/users/me", {
      headers: authHeaders(body.token),
    });
    expect(reuse.status()).toBe(401);

    if (body.refreshToken) {
      const refreshReuse = await request.post("v1/auth/refresh-token", {
        data: { refreshToken: body.refreshToken },
      });
      expect(refreshReuse.status()).toBeGreaterThanOrEqual(400);
    }
  });
});
