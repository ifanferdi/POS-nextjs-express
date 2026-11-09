import { expect, test } from "@playwright/test";
import { authHeaders, signIn } from "../../helpers/api";

/**
 * Verifikasi live temuan security audit — semuanya read-only kecuali
 * yang dinyatakan.
 */
test.describe("api: security probes", () => {
  test("columns=password membocorkan hash Argon2 ke pemegang Show User (temuan #4)", async ({
    request,
  }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/users", {
      headers: authHeaders(body.token),
      // kolom diulang ([]-style) agar parser query Express menghasilkan array.
      params: { "columns[]": "password", limit: 1 },
    });
    expect(res.status()).toBe(200);
    const payload = await res.json();
    const user = payload.data?.[0];
    expect(user).toBeTruthy();
    expect(user.password ?? "", "hash Argon2 terekspos ke pemegang Show User").toMatch(/^\$argon2/);
  });

  test("swagger /docs publik tanpa auth", async ({ request }) => {
    const res = await request.get("/docs", { maxRedirects: 5 });
    expect(res.status()).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(1000);
  });

  test("CORS: origin tak dikenal tidak dapat ACAO header", async ({ request }) => {
    const { body } = await signIn(request, "admin", "password");
    const res = await request.get("v1/users/me", {
      headers: { ...authHeaders(body.token), Origin: "https://evil.example.com" },
    });
    expect(res.headers()["access-control-allow-origin"] ?? "").not.toContain("evil");
  });

  test("header server membocorkan X-Powered-By", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-powered-by"] ?? "").toContain("Express");
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
