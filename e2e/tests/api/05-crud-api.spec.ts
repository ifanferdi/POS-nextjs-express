import { expect, test } from "@playwright/test";
import { authHeaders, getRoleIdByName, signIn } from "../../helpers/api";

/**
 * CRUD siklus penuh di backend produksi. Semua data diberi nama unik
 * bertimestamp dan dibersihkan (delete/cancel) di akhir tiap test.
 * Bentuk response create: { message, <entity>: {...} } dengan status 201.
 */
test.describe("api: CRUD lifecycle (admin)", () => {
  test("category: create → update → delete (hard delete)", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const name = `E2E API Cat ${Date.now()}`;

    const create = await request.post("v1/categories", {
      headers: authHeaders(body.token),
      data: { name, description: "dibuat oleh e2e" },
    });
    expect(create.status()).toBe(201);
    const cat = (await create.json()).category;
    expect(cat.name).toBe(name);

    const update = await request.put(`v1/categories/${cat.id}`, {
      headers: authHeaders(body.token),
      data: { id: cat.id, name: `${name} v2` },
    });
    expect(update.status()).toBeLessThan(300);

    const del = await request.delete(`v1/categories/${cat.id}`, {
      headers: authHeaders(body.token),
    });
    expect(del.status()).toBeLessThan(300);

    const after = await request.get(`v1/categories/${cat.id}`, {
      headers: authHeaders(body.token),
    });
    expect(after.status()).toBe(404);
  });

  test("product: create → update → soft delete", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const uniq = `e2e-${Date.now()}`;

    const create = await request.post("v1/products", {
      headers: authHeaders(body.token),
      data: { name: `E2E API Product ${uniq}`, price: 25000, sku: uniq, stock: 10 },
    });
    expect(create.status()).toBe(201);
    const product = (await create.json()).product;
    expect(product.sku).toBe(uniq);

    const update = await request.put(`v1/products/${product.id}`, {
      headers: authHeaders(body.token),
      data: { id: product.id, price: 27500 },
    });
    expect(update.status()).toBeLessThan(300);

    const del = await request.delete(`v1/products/${product.id}`, {
      headers: authHeaders(body.token),
    });
    expect(del.status()).toBeLessThan(300);
  });

  test("user: create (role User) → soft delete", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const roleId = await getRoleIdByName(request, body.token, "User");
    expect(roleId).toBeTruthy();

    const username = `e2euser${Date.now()}`.slice(0, 40);
    const create = await request.post("v1/users", {
      headers: authHeaders(body.token),
      data: {
        username,
        roleId,
        password: "E2ePass123!",
        confirmPassword: "E2ePass123!",
        profile: {
          fullName: "E2E API User",
          placeOfBirth: "Depok",
          dateOfBirth: "2000-01-01",
          gender: "male", // wajib menurut UserProfileSchema
        },
      },
    });
    expect(create.status()).toBe(201);
    const user = (await create.json()).user;
    expect(user.username).toBe(username);

    const del = await request.delete(`v1/users/${user.id}`, {
      headers: authHeaders(body.token),
    });
    expect(del.status()).toBeLessThan(300);
  });

  test("order: create cash (idempotent) → cancel sebagai cleanup", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");

    // Pilih produk dengan stok (produk terbaru bisa stok 0; "stok tidak
    // mencukupi" saat itu malah dibalas 500 — temuan error handling).
    const productsRes = await request.get("v1/products", {
      headers: authHeaders(body.token),
      params: { limit: 25 },
    });
    const product = (await productsRes.json()).data?.find(
      (p: { stock: number; isActive: boolean }) => p.stock > 0 && p.isActive,
    );
    test.skip(!product, "Tidak ada produk berstok untuk order");

    const idempotencyKey = crypto.randomUUID();
    const payload = {
      userId: body.user.id,
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: "cash",
      amount: product.price, // wajib untuk cash (sama dengan tendered)
    };
    const create = await request.post("v1/orders", {
      headers: { ...authHeaders(body.token), "Idempotency-Key": idempotencyKey },
      data: payload,
    });
    expect(create.status()).toBeLessThan(300);
    const order = (await create.json()).order ?? (await create.json()).data;
    expect(order.id).toBeTruthy();
    console.log(`[e2e] Order API dibuat di produksi: ${order.orderNumber}`);

    // Idempotensi: request ulang dengan key sama harus mengembalikan order yang sama.
    const repeat = await request.post("v1/orders", {
      headers: { ...authHeaders(body.token), "Idempotency-Key": idempotencyKey },
      data: payload,
    });
    expect(repeat.status()).toBeLessThan(300);
    const repeatBody = await repeat.json();
    const repeatOrder = repeatBody.order ?? repeatBody.data;
    expect(repeatOrder.id).toBe(order.id);

    // Cleanup: batalkan order test.
    const cancel = await request.post(`v1/orders/${order.id}/cancel`, {
      headers: authHeaders(body.token),
    });
    expect(cancel.status()).toBeLessThan(300);
  });
});
