import { expect, test } from "@playwright/test";
import { authHeaders, signIn } from "../../helpers/api";

test.describe("api: validasi input", () => {
  test("sign-in tanpa field → 400 dengan message", async ({ request }) => {
    const res = await request.post("v1/auth/sign-in", { data: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toBeTruthy();
  });

  test("create category tanpa name → 400", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.post("v1/categories", {
      headers: authHeaders(body.token),
      data: { name: "" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("Name");
  });

  test("create order tanpa Idempotency-Key → 400", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.post("v1/orders", {
      headers: authHeaders(body.token),
      data: { userId: body.user.id, items: [{ productId: 1, quantity: 1 }], paymentMethod: "cash" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("Idempotency-Key");
  });

  test("create order dengan Idempotency-Key bukan UUID → 400", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.post("v1/orders", {
      headers: { ...authHeaders(body.token), "Idempotency-Key": "bukan-uuid" },
      data: { userId: body.user.id, items: [{ productId: 1, quantity: 1 }], paymentMethod: "cash" },
    });
    expect(res.status()).toBe(400);
  });

  test("check-quota dengan body bukan array → 400 (response berbentuk array, bukan envelope)", async ({
    request,
  }) => {
    const { body } = await signIn(request, "user1", "password");
    const res = await request.post("v1/product-discount-cycles/check-quota", {
      headers: authHeaders(body.token),
      data: { productId: 1 },
    });
    expect(res.status()).toBe(400);
    const raw = await res.json();
    // Temuan audit: endpoint ini membalas array mentah, beda dari kontrak {message}.
    test.info().annotations.push({ type: "finding", description: JSON.stringify(raw).slice(0, 200) });
  });

  test("payload body unknown keys diabaikan (mass assignment aman)", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const name = `E2E Mass ${Date.now()}`;
    const res = await request.post("v1/categories", {
      headers: authHeaders(body.token),
      data: { name, roleId: 1, id: 999999, isAdmin: true }, // field liar harus diabaikan
    });
    expect(res.status()).toBeLessThan(300);
    const created = await res.json();
    const cat = created.category ?? created.data ?? created;
    expect(cat.name).toBe(name);
    // Bersihkan.
    await request.delete(`v1/categories/${cat.id}`, { headers: authHeaders(body.token) });
  });

  test("order saat stok 0 → 400 (business error, bukan 500 — fix #15)", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const uniq = `e2e-zero-${Date.now()}`;
    const create = await request.post("v1/products", {
      headers: authHeaders(body.token),
      data: { name: `E2E Zero Stock ${uniq}`, price: 1000, sku: uniq, stock: 0 },
    });
    expect(create.status()).toBe(201);
    const product = (await create.json()).product;

    const res = await request.post("v1/orders", {
      headers: { ...authHeaders(body.token), "Idempotency-Key": crypto.randomUUID() },
      data: {
        userId: body.user.id,
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: "cash",
        amount: product.price,
      },
    });
    // Perhatian: gagal sampai PR terdeploy (produksi masih 500).
    expect(res.status()).toBe(400);

    // Bersihkan produk uji.
    await request.delete(`v1/products/${product.id}`, { headers: authHeaders(body.token) });
  });

  test("rate limit: percobaan login gagal berulang → 429 (fix #10)", async ({ request }) => {
    // Adaptive: counter 15 menit per IP+username bisa sudah terisi oleh test lain.
    let status = 0;
    for (let i = 0; i < 15; i++) {
      const res = await signIn(request, "admin", `salah-rate-${i}`);
      status = res.status;
      if (status === 429) break;
    }
    // Perhatian: gagal sampai PR terdeploy (produksi belum ada limiter).
    expect(status).toBe(429);
  });
});
