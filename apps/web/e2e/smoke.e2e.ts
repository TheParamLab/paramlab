import { expect, test } from "@playwright/test";

test("landing page is public and renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("PARAMLAB").first()).toBeVisible();
});

test("redirects anonymous visitors to the login page", async ({ page }) => {
  await page.goto("/cabinet");

  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("renders the passwordless auth gateway", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page.getByText("Вход в ParamLab")).toBeVisible();
  await expect(page.getByLabel("Рабочая или личная почта")).toHaveAttribute(
    "type",
    "email",
  );
  await expect(
    page.getByRole("button", { name: "Получить код" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Войти через Яндекс ID" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "← Вернуться в конфигуратор" }),
  ).toBeVisible();
});
