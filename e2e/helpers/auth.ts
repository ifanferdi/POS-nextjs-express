import { Page, expect } from "@playwright/test";

export const TEST_USERNAME = process.env.E2E_USERNAME ?? "admin";
export const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "password";

// Domain "pos-app-ifan" mengandung "pos": regex mentah di URL palsu match.
// Selalu cocokkan terhadap pathname.
export const hasPath = (re: RegExp) => (url: URL) => re.test(url.pathname);

/**
 * UI login via the real login form (Server Action + Auth.js).
 * Waits for redirect to a protected page; throws if the toast signals failure.
 */
export async function login(page: Page, username = TEST_USERNAME, password = TEST_PASSWORD) {
  await page.goto("/login");
  const form = page.locator("#form-login");
  await expect(form).toBeVisible();
  // Production build prefills demo credentials; always overwrite.
  await form.locator("#username").fill(username);
  await form.locator("#password").fill(password);
  await form.getByRole("button", { name: /sign in to dashboard/i }).click();
  await page.waitForURL(hasPath(/^\/(dashboard|pos|users)/), { timeout: 30_000 });
}

export async function logout(page: Page, username = TEST_USERNAME) {
  // Ada 2 tombol berisi username: footer sidebar (duluan) & menu top-bar; pakai .last().
  await page.getByRole("button", { name: new RegExp(username, "i") }).last().click();
  await page.getByRole("menuitem", { name: /logout/i }).click();
  await page.waitForURL(hasPath(/^\/login/));
}
