import { expect, test } from "@playwright/test";
import { login } from "../../helpers/auth";

test.describe("pages: content smoke (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard renders KPIs, filters, and CSV export", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();

    for (const label of ["Total Orders", "Revenue", "Avg Order Value", "Total Products"]) {
      // .first(): label KPI; "Revenue"/"Orders" juga muncul di toggle grafik.
      await expect(page.getByText(label).first()).toBeVisible();
    }
    // Date filter dan granularity ("To" substring-match banyak teks → exact).
    await expect(page.getByText("From", { exact: true })).toBeVisible();
    await expect(page.getByText("To", { exact: true })).toBeVisible();
    await expect(page.getByText("Granularity")).toBeVisible();

    // Export CSV lewat proxy BFF → backend.
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: /export csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test("categories page shows create button and search", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: "Categories", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new category/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search categories...")).toBeVisible();
  });

  test("products page shows create button and search", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new product/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search products...")).toBeVisible();
  });

  test("orders page renders table or empty state", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Orders", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Search order number...")).toBeVisible();
    // Seeded prod punya order; terima salah satu state agar tidak flaky.
    const hasRows = await page.getByText("Order #").first().isVisible().catch(() => false);
    if (!hasRows) {
      await expect(page.getByText("No orders found.")).toBeVisible();
    }
  });

  test("users page shows create button and search", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new user/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search users...")).toBeVisible();
  });

  test("discounts page shows create button", async ({ page }) => {
    await page.goto("/product-discount-cycles");
    await expect(page.getByRole("heading", { name: "Product discounts", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /new discount cycle/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search product name...")).toBeVisible();
  });

  test("account page shows profile and security sections", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "My Account", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /change password/i })).toBeVisible();
  });
});
