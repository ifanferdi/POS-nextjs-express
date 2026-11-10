import { expect, test } from "@playwright/test";
import { hasPath, login, logout, TEST_PASSWORD, TEST_USERNAME } from "../../helpers/auth";

test.describe("auth: unauthenticated access", () => {
  // Middleware (proxy.ts) hanya membolehkan /login tanpa session.
  for (const path of ["/", "/dashboard", "/pos", "/products", "/api/sse"]) {
    test(`redirects ${path} to /login`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers()["location"]).toContain("/login");
    });
  }
});

test.describe("auth: login form", () => {
  test("wrong credentials shows toast, stays on /login", async ({ page }) => {
    await page.goto("/login");
    const form = page.locator("#form-login");
    await form.locator("#username").fill(TEST_USERNAME);
    await form.locator("#password").fill("wrong-password-e2e");
    await form.getByRole("button", { name: /sign in to dashboard/i }).click();

    // Toaster kini di root layout (fix kualitas #1): toast error login harus
    // terlihat. Perhatian: gagal sampai app terdeploy.
    await expect(page).toHaveURL(hasPath(/^\/login$/));
    await expect(page.getByText("Login failed")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("Username or password invalid.")).toBeVisible();
  });

  test("valid credentials (admin) lands on /dashboard", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  });

  test("user role (user1) lands on /pos", async ({ page }) => {
    await login(page, "user1", "password");
    await expect(page).toHaveURL(hasPath(/^\/pos/));
    // .last(): elemen pertama adalah header mobile yang tersembunyi di viewport lg.
    await expect(page.getByText("Cart").last()).toBeVisible();
  });

  test("already-authenticated /login redirects away", async ({ page }) => {
    await login(page);
    await page.goto("/login");
    await expect(page).not.toHaveURL(hasPath(/^\/login$/));
  });

  test("logout returns to /login", async ({ page }) => {
    await login(page);
    await logout(page, TEST_USERNAME);
    await expect(page).toHaveURL(hasPath(/^\/login/));
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

test.describe("auth: session expiry hint", () => {
  test("?reason=expired shows the expiry notice", async ({ page }) => {
    await page.goto("/login?reason=expired");
    await expect(page.getByText("Your session expired. Please sign in again.")).toBeVisible();
  });
});
