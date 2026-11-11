import { expect, test } from "@playwright/test";
import { hasPath, login } from "../../helpers/auth";

test.describe("navigation: protected shell (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const navTargets: Array<{ link: string; heading: string }> = [
    { link: "Dashboard", heading: "Dashboard" },
    { link: "Categories", heading: "Categories" },
    { link: "Products", heading: "Products" },
    { link: "Discounts", heading: "Product discounts" },
    { link: "Orders", heading: "Orders" },
    { link: "Users", heading: "Users" },
  ];

  test("sidebar shows all management links", async ({ page }) => {
    await expect(page.getByText("Management")).toBeVisible();
    for (const { link } of navTargets) {
      await expect(page.getByRole("link", { name: link })).toBeVisible();
    }
  });

  for (const { link, heading } of navTargets) {
    test(`navigates to ${heading}`, async ({ page }) => {
      await page.getByRole("link", { name: link }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    });
  }

  test("POS button in top bar opens cashier screen", async ({ page }) => {
    await page.getByRole("link", { name: "POS", exact: true }).click();
    await expect(page).toHaveURL(hasPath(/^\/pos/));
    await expect(page.getByText("Cart").last()).toBeVisible();
  });

  test("avatar menu opens My Account", async ({ page }) => {
    // .last(): yang pertama adalah footer sidebar, bukan menu top-bar.
    await page.getByRole("button", { name: /admin/i }).last().click();
    await page.getByRole("menuitem", { name: /my account/i }).click();
    await expect(page).toHaveURL(hasPath(/^\/account/));
    await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
  });

  test("unknown route shows 404 page", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByText("Page not found")).toBeVisible();
  });
});
