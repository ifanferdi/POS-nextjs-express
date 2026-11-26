import { expect, test } from "@playwright/test";
import { login } from "../../helpers/auth";

/**
 * Checks RBAC & middleware di sisi UI dengan akun role User (user1):
 * 6 permission: Show Order, Manage Order, Manage Payment, Show Product,
 * Show Category, Show Product Discount Cycle.
 */
test.describe("security: RBAC & middleware (user1)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "user1", "password");
  });

  test("users page is forbidden (403) without Show User", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText("Access denied")).toBeVisible();
    // Aksi 403 berupa <Link>, bukan <button>.
    await expect(page.getByRole("link", { name: /back to dashboard/i })).toBeVisible();
  });

  test("products page loads but manage button is hidden", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new product/i })).toHaveCount(0);
  });

  test("categories page loads but manage button is hidden", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: "Categories", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new category/i })).toHaveCount(0);
  });

  test("orders page is accessible (Show Order)", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
  });
});

test.describe("security: SSE proxy access control", () => {
  test("unauthenticated /api/sse redirects to login", async ({ request }) => {
    const res = await request.get("/api/sse", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/login");
  });

  test("authenticated /api/sse streams", async ({ page }) => {
    await login(page);
    // SSE tidak pernah "selesai": fetch biasa/APIRequestContext akan hang.
    // Pakai fetch dengan AbortController; resolve saat header diterima.
    const result = await page.evaluate(async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch("/api/sse", { signal: ctrl.signal });
        return { ok: res.ok, status: res.status, type: res.headers.get("content-type") };
      } catch {
        return { ok: false, status: 0, type: "" };
      } finally {
        clearTimeout(timer);
      }
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.type).toContain("text/event-stream");
  });
});
