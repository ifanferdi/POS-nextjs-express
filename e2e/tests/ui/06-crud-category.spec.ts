import { expect, test } from "@playwright/test";
import { login } from "../../helpers/auth";

const API_BASE = process.env.E2E_API_URL ?? "https://pos-ifan.duckdns.org/api";

/**
 * CRUD kategori di backend produksi lewat UI.
 * Nama unik bertimestamp, dihapus di akhir. Verifikasi hapus lewat API
 * (list UI pakai search debounced → bisa menyajikan hasil stale).
 * CRUD produk/user/order tidak dilakukan di UI: butuh banyak field dan
 * flaky; ditutup lewat API suite.
 */
test.describe("crud: category lifecycle (admin)", () => {
  const unique = `E2E ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/categories");
  });

  test("create → search → edit → delete", async ({ page, request }) => {
    // Create.
    await page.getByRole("button", { name: /add new category/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#name").fill(unique);
    await dialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Create new Category successfully!")).toBeVisible();

    // Cari hasil buatan.
    const search = page.getByPlaceholder("Search categories...");
    await search.fill(unique);
    await expect(page.getByText(unique).first()).toBeVisible();

    // Edit.
    const renamed = `${unique} v2`;
    await page.getByRole("button", { name: "Edit category" }).first().click();
    const editDialog = page.getByRole("dialog");
    await editDialog.locator("#name").fill(renamed);
    await editDialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Update Category successfully")).toBeVisible();

    await search.fill("");
    await search.fill(renamed);
    await expect(page.getByText(renamed).first()).toBeVisible();

    // Ambil id kategori lewat API untuk verifikasi hapus yang deterministik.
    const signInRes = await request.post(`${API_BASE}/v1/auth/sign-in`, {
      data: { username: "admin", password: "password" },
    });
    const token = (await signInRes.json()).token;
    const findRes = await request.get(`${API_BASE}/v1/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { name: renamed },
    });
    const category = (await findRes.json()).data?.[0];
    expect(category?.id).toBeTruthy();

    // Delete lewat UI — scope ke baris kategori ini, bukan .first()
    // (race debounce search bisa menampilkan baris lain di posisi pertama).
    const row = page.getByRole("row").filter({ hasText: renamed }).first();
    await row.getByRole("button", { name: /delete category/i }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog.getByText("Delete Category")).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Category deleted successfully.")).toBeVisible();

    // Verifikasi via API: kategori benar-benar hilang (hard delete).
    const after = await request.get(`${API_BASE}/v1/categories/${category.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(after.status()).toBe(404);
  });
});
