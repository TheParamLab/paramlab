import { describe, expect, test } from "bun:test";
import { accountFormSchema } from "./account";
import { calcPartPrice, estimateMassFromVolume } from "./catalog";
import { loginFormSchema } from "./login";
import { partFormatFromFileName } from "./order";
import { otpFormSchema } from "./otp";
import { changePasswordFormSchema } from "./password";
import { profileFormSchema } from "./profile";

describe("profileFormSchema", () => {
  test("accepts a valid profile", () => {
    const result = profileFormSchema.safeParse({
      username: "jane",
      email: "jane@example.com",
      bio: "hello",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a too-short username", () => {
    const result = profileFormSchema.safeParse({
      username: "j",
      email: "jane@example.com",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const result = profileFormSchema.safeParse({
      username: "jane",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a bio longer than 160 chars", () => {
    const result = profileFormSchema.safeParse({
      username: "jane",
      email: "jane@example.com",
      bio: "x".repeat(161),
    });
    expect(result.success).toBe(false);
  });
});

describe("accountFormSchema", () => {
  test("accepts a valid account", () => {
    const result = accountFormSchema.safeParse({
      name: "Jane",
      language: "en",
    });
    expect(result.success).toBe(true);
  });

  test("language is optional", () => {
    const result = accountFormSchema.safeParse({ name: "Jane" });
    expect(result.success).toBe(true);
  });

  test("rejects a too-short name", () => {
    const result = accountFormSchema.safeParse({ name: "J" });
    expect(result.success).toBe(false);
  });
});

describe("loginFormSchema", () => {
  test("accepts a valid email", () => {
    expect(loginFormSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  test("rejects an empty email", () => {
    expect(loginFormSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("otpFormSchema", () => {
  test("accepts a 6-digit code", () => {
    expect(otpFormSchema.safeParse({ otp: "123456" }).success).toBe(true);
  });

  test("rejects non-digit codes", () => {
    expect(otpFormSchema.safeParse({ otp: "12345a" }).success).toBe(false);
  });

  test("rejects codes that are not exactly 6 digits", () => {
    expect(otpFormSchema.safeParse({ otp: "12345" }).success).toBe(false);
  });
});

describe("changePasswordFormSchema", () => {
  const valid = {
    currentPassword: "old-password",
    newPassword: "new-password-1",
    confirmPassword: "new-password-1",
    revokeOtherSessions: true,
  };

  test("accepts a valid password change", () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true);
  });

  test("requires the current password", () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      currentPassword: "",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a new password shorter than 8 characters", () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a new password longer than 128 characters", () => {
    const long = "x".repeat(129);
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      newPassword: long,
      confirmPassword: long,
    });
    expect(result.success).toBe(false);
  });

  test("rejects mismatched confirmation on the confirm field", () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      confirmPassword: "different-password",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  test("rejects reusing the current password", () => {
    const result = changePasswordFormSchema.safeParse({
      ...valid,
      newPassword: valid.currentPassword,
      confirmPassword: valid.currentPassword,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });
});

describe("catalog pricing", () => {
  test("applies the minimum order", () => {
    const price = calcPartPrice({
      massGrams: 10,
      materialId: "petg",
      quantity: 1,
    });
    expect(price).toEqual({ total: 1400, series: false, totalMass: 10 });
  });

  test("gives the series discount from 10 pieces", () => {
    // 400 + 50 г × 10 шт. × 18 ₽ × 0,8 = 7 600 ₽
    const price = calcPartPrice({
      massGrams: 50,
      materialId: "petg",
      quantity: 10,
    });
    expect(price.total).toBe(7600);
    expect(price.series).toBe(true);
  });

  test("estimates mass from volume and clamps it", () => {
    // 100 см³ × 1,27 г/см³ × 0,5 заполнения
    expect(estimateMassFromVolume(100, "petg")).toBe(64);
    expect(estimateMassFromVolume(0, "petg")).toBe(1);
  });
});

describe("partFormatFromFileName", () => {
  test("maps supported extensions, case-insensitively", () => {
    expect(partFormatFromFileName("Корпус.STL")).toBe("stl");
    expect(partFormatFromFileName("gear.stp")).toBe("step");
    expect(partFormatFromFileName("a.b.3mf")).toBe("3mf");
  });

  test("rejects everything else", () => {
    expect(partFormatFromFileName("model.obj")).toBeNull();
    expect(partFormatFromFileName("model")).toBeNull();
  });
});
