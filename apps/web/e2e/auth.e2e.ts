import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${crypto.randomUUID()}@example.com`;
}

test("transitions from email step to 6-slot OTP step and shows draft part passport", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto(
    "/auth/login?draft=1&partType=bushing&material=petgcf&d1=42&d2=34&h=30&qty=2&price=1450",
  );

  await expect(page.getByText("Конфигурация сохранена")).toBeVisible();
  await expect(page.getByTestId("draft-part-dimensions")).toHaveText(
    "D42 × T4 × H30",
  );
  await expect(page.getByTestId("draft-part-material")).toHaveText("PETG-CF");

  await page.getByLabel("Рабочая или личная почта").fill(email);
  await page.getByRole("button", { name: "Получить код" }).click();

  await expect(page.getByText("Введите код из письма")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByLabel("Цифра 1 из 6")).toBeVisible();
});

test("shows error on invalid 6-digit OTP code and clears error on next input", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/auth/login");
  await page.getByLabel("Рабочая или личная почта").fill(email);
  await page.getByRole("button", { name: "Получить код" }).click();

  await expect(page.getByText("Введите код из письма")).toBeVisible();

  const firstSlot = page.getByLabel("Цифра 1 из 6");
  await firstSlot.fill("000000");

  await expect(page.getByTestId("otp-error-message")).toHaveText(
    "Код не совпал или истёк. Проверьте письмо",
  );

  // При начале повторного ввода ошибка сразу сбрасывается
  await page.getByLabel("Цифра 6 из 6").press("Backspace");
  await expect(page.getByTestId("otp-error-message")).toBeHidden();
});
