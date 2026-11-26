import { expect, test } from "@playwright/test";
import { authHeaders, signIn } from "../../helpers/api";

/**
 * Verifikasi live temuan security audit — semuanya read-only kecuali
 * yang dinyatakan.
 */
test.describe("api: security probes", () => {
  test("columns[]=password DITOLAK — hash Argon2 tidak lagi bocor (fix #3)", async ({
    request,
  }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/users", {
      headers: authHeaders(body.token),
      // kolom diulang ([]-style) agar parser query Express menghasilkan array.
      params: { "columns[]": "password", limit: 1 },
    });
    // Perhatian: gagal sampai PR terdeploy (produksi masih membocorkan hash).
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toContain("columns");
  });

  test("swagger /docs TIDAK tersedia di produksi (fix #13)", async ({ request }) => {
    // Perhatian: gagal sampai PR terdeploy (produksi masih 200).
    const res = await request.get("/docs", { maxRedirects: 5 });
    expect(res.status()).toBe(404);
  });

  test("CORS: origin tak dikenal tidak dapat ACAO header", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/users/me", {
      headers: { ...authHeaders(body.token), Origin: "https://evil.example.com" },
    });
    expect(res.headers()["access-control-allow-origin"] ?? "").not.toContain("evil");
  });

  test("header X-Powered-By dihapus oleh helmet (fix #10)", async ({ request }) => {
    // Perhatian: gagal sampai PR terdeploy (produksi masih menampilkannya).
    const res = await request.get("/");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });

  test("route tak dikenal → hang (404 handler tak tercapai, temuan #3)", async ({ request }) => {
    let timedOut = false;
    let status = 0;
    try {
      const res = await request.get("v1/benar-benar-tidak-ada", { timeout: 6000 });
      status = res.status();
    } catch {
      timedOut = true;
    }
    test.info().annotations.push({
      type: "finding",
      description: timedOut ? "request hang (DoS surface terkonfirmasi)" : `status=${status}`,
    });
    // Kedua hasil adalah bukti; hang = temuan terkonfirmasi.
    expect(timedOut || status >= 400).toBe(true);
  });

  test("webhook mock tanpa auth → hang/rusak (temuan #3)", async ({ request }) => {
    let timedOut = false;
    let status = 0;
    try {
      const res = await request.post("v1/webhooks/midtrans/mock", {
        data: { order_id: "INV-TEST-1" },
        timeout: 6000,
      });
      status = res.status();
    } catch {
      timedOut = true;
    }
    test.info().annotations.push({
      type: "finding",
      description: timedOut ? "webhook hang — pembayaran Midtrans tak bisa diproses" : `status=${status}`,
    });
    expect(timedOut || status >= 400).toBe(true);
  });
});
