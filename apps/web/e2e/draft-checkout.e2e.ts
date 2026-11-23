import { expect, test } from "@playwright/test";

test("keeps the draft on write failure and restores the saved demo order after reload", async ({
  page,
}) => {
  const user = {
    id: "checkout-test",
    email: "checkout@example.com",
    name: "Checkout Test",
    emailVerified: true,
  };
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({ json: { user, session: { userId: user.id } } }),
  );
  await page.goto("/orders/new");
  await expect(
    page.getByRole("link", { name: "Вернуться в конфигуратор" }),
  ).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem(
      "paramlab_draft_part",
      JSON.stringify({
        partType: "bushing",
        materialId: "petgcf",
        dimensions: { d1: 42, d2: 34, h: 30 },
        quantity: 10,
      }),
    );
    sessionStorage.setItem("test-fail-draft-order-write", "1");
  });
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key.startsWith("paramlab_dashboard_draft_orders:") &&
        sessionStorage.getItem("test-fail-draft-order-write")
      ) {
        throw new DOMException("Storage unavailable");
      }
      setItem.call(this, key, value);
    };
  });
  await page.reload();

  const pvz = page.getByRole("button", { name: /OZN-/ }).last();
  await pvz.click();
  await expect(pvz).toHaveAttribute("aria-pressed", "true");
  const confirm = page.getByRole("button", { name: "Сохранить демо-заказ" });
  await confirm.click();
  await expect(page.getByText(/Не удалось сохранить заказ/)).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("paramlab_draft_part")),
  ).not.toBeNull();

  await page.evaluate(() =>
    sessionStorage.removeItem("test-fail-draft-order-write"),
  );
  await confirm.click();
  await expect(page).toHaveURL(/\/orders$/);
  expect(
    await page.evaluate(() => localStorage.getItem("paramlab_draft_part")),
  ).toBeNull();
  await page.reload();
  await expect(page.getByText("D42 × T4 × H30").first()).toBeVisible();
});
