import { expect, test } from "@playwright/test";
import { authHeaders, signIn } from "../../helpers/api";

/**
 * Matriks RBAC berdasarkan seed role:
 * - admin: semua kecuali Show/Manage Permission.
 * - user1 (role User): Show Order, Manage Order, Manage Payment, Show Product,
 *   Show Category, Show Product Discount Cycle.
 */
test.describe("api: RBAC matrix", () => {
  test("admin 403 pada semua route /permissions", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    for (const path of ["v1/permissions", "v1/permissions/get", "v1/permissions/1"]) {
      const res = await request.get(path, { headers: authHeaders(body.token) });
      expect(res.status(), `admin harusnya 403 di ${path}`).toBe(403);
    }
  });

  test("admin bisa baca roles", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/roles", { headers: authHeaders(body.token) });
    expect(res.status()).toBe(200);
  });

  test("user1 403 pada users/roles/permissions/payments", async ({ request }) => {
    const { body } = await signIn(request, "user1", "password");
    for (const path of [
      "v1/users",
      "v1/users/get",
      "v1/roles",
      "v1/permissions",
      "v1/payments",
    ]) {
      const res = await request.get(path, { headers: authHeaders(body.token) });
      expect(res.status(), `user1 harusnya 403 di ${path}`).toBe(403);
    }
  });

  test("user1 403 saat create category (tanpa Manage Category)", async ({ request }) => {
    const { body } = await signIn(request, "user1", "password");
    const res = await request.post("v1/categories", {
      headers: authHeaders(body.token),
      data: { name: `E2E forbidden ${Date.now()}` },
    });
    expect(res.status()).toBe(403);
  });

  test("user1 bisa baca orders (Show Order)", async ({ request }) => {
    const { body } = await signIn(request, "user1", "password");
    const res = await request.get("v1/orders?limit=5", {
      headers: authHeaders(body.token),
    });
    expect(res.status()).toBe(200);
  });

  test("dashboard tanpa permission gate: user1 bisa baca data finansial (temuan audit)", async ({
    request,
  }) => {
    const { body } = await signIn(request, "user1", "password");
    for (const path of [
      "v1/dashboard",
      "v1/dashboard/orders-trend",
      "v1/dashboard/orders-by-status",
      "v1/dashboard/payments",
      "v1/dashboard/top-products",
    ]) {
      const res = await request.get(path, { headers: authHeaders(body.token) });
      expect(res.status(), `user1 harusnya 200 di ${path} (JWT-only, tanpa permission)`).toBe(200);
    }
  });

  test("IDOR: user1 bisa membaca order milik user lain (temuan audit)", async ({ request }) => {
    // Ambil satu order via admin (order seeder tidak dijamin milik admin),
    // lalu baca detailnya sebagai user1 — tidak ada cek kepemilikan di GET /orders/:id.
    const admin = await signIn(request, "admin", "password");
    const list = await request.get("v1/orders?limit=1", {
      headers: authHeaders(admin.body.token),
    });
    expect(list.status()).toBe(200);
    const order = (await list.json()).data?.[0];
    test.skip(!order, "Tidak ada order untuk diverifikasi");

    const user1 = await signIn(request, "user1", "password");
    const res = await request.get(`v1/orders/${order.id}`, {
      headers: authHeaders(user1.body.token),
    });
    // Seharusnya 403 jika ada ownership check; kenyataannya 200.
    expect(res.status()).toBe(200);
    const detail = await res.json();
    expect(detail.orderNumber ?? detail.id ?? detail).toBeTruthy();
  });
});
