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

  test("dashboard RBAC: user1 terbatas — hanya top products, order by status, total products (fix #6)", async ({
    request,
  }) => {
    const { body } = await signIn(request, "user1", "password");
    // Perhatian: gagal sampai PR terdeploy (produksi belum digate).
    const summary = await request.get("v1/dashboard", { headers: authHeaders(body.token) });
    expect(summary.status()).toBe(200);
    const summaryBody = await summary.json();
    expect(summaryBody.totalProducts).toBeTruthy();
    expect(summaryBody.totalRevenue).toBeUndefined();
    expect(summaryBody.totalOrders).toBeUndefined();

    for (const path of [
      "v1/dashboard/orders-trend",
      "v1/dashboard/payments",
      "v1/dashboard/orders/export",
    ]) {
      const res = await request.get(path, { headers: authHeaders(body.token) });
      expect(res.status(), `user1 harusnya 403 di ${path}`).toBe(403);
    }

    for (const path of ["v1/dashboard/orders-by-status", "v1/dashboard/top-products"]) {
      const res = await request.get(path, { headers: authHeaders(body.token) });
      expect(res.status(), `user1 harusnya 200 di ${path}`).toBe(200);
    }
  });

  test("IDOR ditutup: user1 403 order milik user lain, 200 milik sendiri (fix #5)", async ({
    request,
  }) => {
    const admin = await signIn(request, "admin", "password");
    const user1 = await signIn(request, "user1", "password");
    const user1Id = user1.body.user.id;

    const list = await request.get("v1/orders", {
      headers: authHeaders(admin.body.token),
      params: { limit: 25 },
    });
    expect(list.status()).toBe(200);
    const orders = (await list.json()).data ?? [];

    // Order milik user lain → 403. Perhatian: gagal sampai PR terdeploy.
    const others = orders.filter((o: { userId: number }) => o.userId !== user1Id);
    test.skip(!others.length, "Tidak ada order milik user lain untuk diverifikasi");
    const res = await request.get(`v1/orders/${others[0].id}`, {
      headers: authHeaders(user1.body.token),
    });
    expect(res.status()).toBe(403);

    // Order milik sendiri tetap terbaca.
    const own = orders.find((o: { userId: number }) => o.userId === user1Id);
    if (own) {
      const ownRes = await request.get(`v1/orders/${own.id}`, {
        headers: authHeaders(user1.body.token),
      });
      expect(ownRes.status()).toBe(200);
    }
  });

  test("presign digate per folder (fix #12)", async ({ request }) => {
    const user1 = await signIn(request, "user1", "password");
    const admin = await signIn(request, "admin", "password");
    const payload = {
      filename: "test.png",
      fileType: "image",
      contentType: "image/png",
      fileSize: 1000,
      folder: "products",
    };
    // Perhatian: gagal sampai PR terdeploy (produksi belum digate).
    const user1Products = await request.post("v1/uploads/generate-presign-url", {
      headers: authHeaders(user1.body.token),
      data: payload,
    });
    expect(user1Products.status()).toBe(403);

    const adminProducts = await request.post("v1/uploads/generate-presign-url", {
      headers: authHeaders(admin.body.token),
      data: payload,
    });
    expect(adminProducts.status()).toBe(200);

    // Foto profil sendiri tetap boleh untuk semua role terautentikasi.
    const user1Profile = await request.post("v1/uploads/generate-presign-url", {
      headers: authHeaders(user1.body.token),
      data: { ...payload, folder: "profiles" },
    });
    expect(user1Profile.status()).toBe(200);
  });
});
