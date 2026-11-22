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

test("keeps six OTP slots visible and preserves positions when a middle digit is removed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => {
    localStorage.setItem("otp_email", "mobile@example.com");
  });
  await page.route("**/api/auth/sign-in/email-otp", (route) =>
    route.fulfill({ status: 400, json: { message: "Invalid code" } }),
  );
  await page.goto("/auth/otp");

  const group = page.getByRole("group", {
    name: "6-значный код подтверждения",
  });
  const slots = group.getByRole("textbox");
  await expect(slots).toHaveCount(6);
  for (const slot of await slots.all()) {
    await expect(slot).toBeVisible();
    const bounds = await slot.boundingBox();
    const groupBounds = await group.boundingBox();
    if (!bounds || !groupBounds) throw new Error("OTP inputs have no bounds");
    expect(bounds.x).toBeGreaterThanOrEqual(groupBounds.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      groupBounds.x + groupBounds.width,
    );
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    expect(bounds.width).toBeLessThanOrEqual(48);
  }

  await slots.first().fill("123456");
  await expect(page.getByTestId("otp-error-message")).toBeVisible();
  await slots.nth(2).press("Delete");
  await expect(slots.nth(2)).toHaveValue("");
  await expect(slots.nth(3)).toHaveValue("4");
  await expect(slots.nth(5)).toHaveValue("6");
  await expect(
    page.getByRole("button", { name: "Подтвердить и войти" }),
  ).toBeDisabled();

  const verification = page.waitForRequest("**/api/auth/sign-in/email-otp");
  await slots.nth(2).fill("7");
  expect((await verification).postDataJSON()).toMatchObject({ otp: "127456" });
});

test("opens OTP entry when browser storage rejects email reads and writes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const { getItem, setItem } = Storage.prototype;
    Storage.prototype.getItem = function (key) {
      if (key === "otp_email") throw new DOMException("Storage unavailable");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "otp_email") throw new DOMException("Storage unavailable");
      setItem.call(this, key, value);
    };
  });
  await page.route("**/api/auth/email-otp/send-verification-otp", (route) =>
    route.fulfill({ json: { success: true } }),
  );
  await page.goto("/auth/otp");
  const email = page.getByLabel("Рабочая или личная почта");
  await email.fill("storage@example.com");
  await page.getByRole("button", { name: "Получить код" }).click();
  await expect(page.getByText("Введите код из письма")).toBeVisible();
  await expect(page.getByText("storage@example.com")).toBeVisible();
});
