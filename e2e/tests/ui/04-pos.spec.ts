import { expect, test } from "@playwright/test";
import { hasPath, login } from "../../helpers/auth";

/**
 * Alur kasir penuh di POS produksi: cari produk, tambah ke cart,
 * checkout tunai, terima struk, lalu verifikasi order muncul di history.
 * Membuat 1 order sungguhan di backend produksi (qty 1, tunai).
 */
test.describe("pos: cashier flow (user1)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "user1", "password");
    await expect(page).toHaveURL(hasPath(/^\/pos/));
  });

  test("pos shell renders core controls", async ({ page }) => {
    await expect(page.getByText("Cart").last()).toBeVisible();
    await expect(page.getByPlaceholder("Search products...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Checkout" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Open order history" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("checkout cash end-to-end and order appears in history", async ({ page }) => {
    test.setTimeout(120_000);

    // Tunggu grid produk termuat; jika prod kosong, lewati alur checkout.
    const addButtons = page.getByRole("button", { name: "+ Add" });
    await addButtons.first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => {});
    test.skip(!(await addButtons.first().isVisible().catch(() => false)), "Tidak ada produk di backend produksi");

    // Nama produk dari card pertama untuk assert di cart.
    const firstCard = addButtons
      .first()
      .locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    const productName = (await firstCard.locator("p.line-clamp-1").innerText()).trim();

    await addButtons.first().click();
    // Nama produk muncul di card dan di cart item; scope ke cart (<li>).
    await expect(page.getByRole("listitem").getByText(productName).first()).toBeVisible();
    await expect(page.getByText("1 item").last()).toBeVisible();

    await page.getByRole("button", { name: "Checkout" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Bayar tunai agar tidak menyentuh Midtrans di produksi.
    // Default Payment Method = Cash; Radix Select meletakkan listbox di portal
    // sehingga tidak bisa diklik lewat scope dialog — cukup assert defaultnya.
    const combo = dialog.getByRole("combobox");
    await expect(combo).toBeVisible();
    const selected = ((await combo.innerText()) || "").trim().toLowerCase();
    expect(selected).toContain("cash");

    // Total ditampilkan sebagai teks berformat; parse digitnya.
    const totalLabel = dialog.getByText("Total", { exact: true });
    await expect(totalLabel).toBeVisible();
    const totalText = await totalLabel.locator("xpath=..").locator("span").last().innerText();
    const total = totalText.replace(/\D/g, "");
    expect(total.length).toBeGreaterThan(0);

    await dialog.locator("#amountTendered").fill(total);
    await dialog.getByRole("button", { name: "Complete Payment" }).click();

    // Struk: dialog "Invoice: <orderNumber>".
    const receiptTitle = page.locator("[role='dialog']").getByText(/Invoice: /);
    await expect(receiptTitle).toBeVisible({ timeout: 45_000 });
    const orderNumber = ((await receiptTitle.innerText()).match(/Invoice:\s*(\S+)/) ?? [])[1];
    expect(orderNumber).toBeTruthy();
    console.log(`[e2e] Order dibuat di produksi: ${orderNumber}`);

    await page.getByRole("button", { name: "New Transaction" }).click();
    await expect(page.getByText("No items yet")).toBeVisible();

    // Verifikasi order tercatat di history (hilangkan filter status default).
    await page.getByRole("button", { name: "Open order history" }).click();
    const history = page.getByRole("dialog");
    await expect(history.getByText("Order History")).toBeVisible();

    // Reset filter status (default pending) agar order baru (paid) terlihat.
    // Konten DropdownMenu di-portal ke body — pakai page-level, bukan scope dialog.
    await history.getByRole("button", { name: /filter/i }).click();
    const clear = page.getByRole("menuitem", { name: /clear filter/i });
    if (await clear.isVisible().catch(() => false)) {
      await clear.click();
    } else {
      await page.getByRole("menuitem", { name: /status/i }).hover();
      await page.getByRole("menuitemradio", { name: "All" }).click();
    }
    await history.getByPlaceholder("Search order number...").fill(orderNumber);
    await history.getByPlaceholder("Search order number...").press("Enter");

    await expect(history.getByText(orderNumber).first()).toBeVisible({ timeout: 30_000 });
    await history.getByRole("button", { name: /view order/i }).first().click();
    // "Order Detail" juga muncul di description sr-only → pakai role heading.
    await expect(history.getByRole("heading", { name: /order detail/i })).toBeVisible();
    await expect(history.getByText(orderNumber).first()).toBeVisible();
  });
});
